"""API tests for the core workflows: public catalogue, auth, enrollment gating,
lesson progress, file downloads, admissions/contact, password reset and avatars.
"""
import io
import shutil
import tempfile
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator
from PIL import Image
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import Course, Enrollment, Lesson, LessonFile, Subject

User = get_user_model()
PASSWORD = "Sup3r-Secure-Pass!"
MEDIA_TMP = tempfile.mkdtemp(prefix="brightpath-test-media-")


def make_png_bytes():
    buf = io.BytesIO()
    Image.new("RGB", (4, 4), color=(200, 30, 60)).save(buf, format="PNG")
    return buf.getvalue()


@override_settings(MEDIA_ROOT=MEDIA_TMP)
class BaseApiTest(TestCase):
    def setUp(self):
        # DRF throttling uses the cache; clear it so tests don't affect each other.
        cache.clear()
        self.api = APIClient()
        self.student = User.objects.create_user(
            username="asha@example.com", email="asha@example.com",
            password=PASSWORD, first_name="Asha",
        )
        self.other = User.objects.create_user(
            username="ravi@example.com", email="ravi@example.com",
            password=PASSWORD, first_name="Ravi",
        )
        self.course = Course.objects.create(
            title="NEET Foundation", stage="primary", summary="Foundation course",
            description="Full foundation syllabus", duration="1 year", price=0,
        )
        subject = Subject.objects.create(course=self.course, title="Physics", order=1)
        self.lesson = Lesson.objects.create(subject=subject, title="Motion", order=1)
        self.lesson_file = LessonFile.objects.create(
            lesson=self.lesson, label="notes.txt",
            file=SimpleUploadedFile("notes.txt", b"hello from the notes"),
        )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.api.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def enroll(self, user):
        Enrollment.objects.create(student=user, course=self.course)

    def tearDown(self):
        shutil.rmtree(MEDIA_TMP, ignore_errors=True)


class CatalogueTests(BaseApiTest):
    def test_course_list_is_public(self):
        response = self.api.get("/api/courses/")
        self.assertEqual(response.status_code, 200)
        titles = [c["title"] for c in response.json()]
        self.assertIn("NEET Foundation", titles)

    def test_course_list_filters_by_stage(self):
        Course.objects.create(
            title="JEE Main", stage="middle", summary="s", description="d",
            duration="1 year", price=0,
        )
        response = self.api.get("/api/courses/?stage=middle")
        titles = [c["title"] for c in response.json()]
        self.assertEqual(titles, ["JEE Main"])


class AuthTests(BaseApiTest):
    def test_register_returns_token_and_user(self):
        response = self.api.post("/api/auth/register/", {
            "email": "new.student@example.com",
            "password": PASSWORD,
            "full_name": "New Student",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertIn("token", response.json())
        self.assertEqual(response.json()["user"]["email"], "new.student@example.com")

    def test_register_rejects_duplicate_email(self):
        response = self.api.post("/api/auth/register/", {
            "email": "asha@example.com", "password": PASSWORD, "full_name": "Dup",
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())

    def test_login_success_returns_token(self):
        response = self.api.post("/api/auth/login/", {
            "email": "asha@example.com", "password": PASSWORD,
        }, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["token"])

    def test_login_rejects_wrong_password(self):
        response = self.api.post("/api/auth/login/", {
            "email": "asha@example.com", "password": "wrong-password-123",
        }, format="json")
        self.assertEqual(response.status_code, 401)

    def test_me_requires_authentication(self):
        self.assertIn(self.api.get("/api/auth/me/").status_code, (401, 403))

    def test_me_returns_current_user(self):
        self.authenticate(self.student)
        response = self.api.get("/api/auth/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], "asha@example.com")

    def test_password_reset_request_does_not_reveal_accounts(self):
        known = self.api.post("/api/auth/password-reset/", {"email": "asha@example.com"}, format="json")
        unknown = self.api.post("/api/auth/password-reset/", {"email": "nobody@example.com"}, format="json")
        self.assertEqual(known.status_code, 200)
        self.assertEqual(known.json(), unknown.json())
        # Only the real account receives an email.
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["asha@example.com"])

    def test_password_reset_confirm_changes_password_and_revokes_tokens(self):
        Token.objects.get_or_create(user=self.student)
        uid = urlsafe_base64_encode(force_bytes(self.student.pk))
        token = default_token_generator.make_token(self.student)
        response = self.api.post("/api/auth/password-reset-confirm/", {
            "uid": uid, "token": token, "new_password": "An0ther-Strong-Pass",
        }, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Token.objects.filter(user=self.student).exists())
        login = self.api.post("/api/auth/login/", {
            "email": "asha@example.com", "password": "An0ther-Strong-Pass",
        }, format="json")
        self.assertEqual(login.status_code, 200)

    def test_password_reset_confirm_rejects_bad_token(self):
        uid = urlsafe_base64_encode(force_bytes(self.student.pk))
        response = self.api.post("/api/auth/password-reset-confirm/", {
            "uid": uid, "token": "bad-token", "new_password": "An0ther-Strong-Pass",
        }, format="json")
        self.assertEqual(response.status_code, 400)


class EnrollmentAndLearningTests(BaseApiTest):
    def test_enroll_then_appears_in_my_courses(self):
        self.authenticate(self.student)
        response = self.api.post("/api/enroll/", {"course_id": self.course.id}, format="json")
        self.assertEqual(response.status_code, 201)
        mine = self.api.get("/api/my-courses/").json()
        self.assertEqual([e["course"]["id"] for e in mine], [self.course.id])

    def test_enroll_unknown_course_is_rejected(self):
        self.authenticate(self.student)
        response = self.api.post("/api/enroll/", {"course_id": 999999}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_learn_page_requires_enrollment(self):
        self.authenticate(self.other)
        self.assertEqual(self.api.get(f"/api/courses/{self.course.id}/learn/").status_code, 403)
        self.enroll(self.other)
        response = self.api.get(f"/api/courses/{self.course.id}/learn/")
        self.assertEqual(response.status_code, 200)

    def test_learn_page_is_not_available_anonymously(self):
        self.enroll(self.student)
        self.assertIn(self.api.get(f"/api/courses/{self.course.id}/learn/").status_code, (401, 403))

    def test_lesson_completion_requires_enrollment(self):
        self.authenticate(self.other)
        response = self.api.post(f"/api/lessons/{self.lesson.id}/complete/")
        self.assertEqual(response.status_code, 403)

    def test_lesson_completion_updates_progress(self):
        self.enroll(self.student)
        self.authenticate(self.student)
        response = self.api.post(f"/api/lessons/{self.lesson.id}/complete/")
        self.assertEqual(response.status_code, 200)
        progress = self.api.get(f"/api/courses/{self.course.id}/learn/").json()["progress"]
        self.assertEqual(progress["completed"], 1)
        self.assertEqual(progress["percent"], 100)

    def test_lesson_file_download_requires_enrollment(self):
        self.authenticate(self.other)
        response = self.api.get(f"/api/lesson-files/{self.lesson_file.id}/download/")
        self.assertEqual(response.status_code, 403)

    def test_lesson_file_download_for_enrolled_student(self):
        self.enroll(self.student)
        self.authenticate(self.student)
        response = self.api.get(f"/api/lesson-files/{self.lesson_file.id}/download/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(b"".join(response.streaming_content), b"hello from the notes")


class PublicFormTests(BaseApiTest):
    def test_contact_message_is_accepted(self):
        response = self.api.post("/api/contact/", {
            "name": "Visitor", "email": "visitor@example.com", "phone": "",
            "subject": "Timings", "message": "What are the batch timings?",
        }, format="json")
        self.assertEqual(response.status_code, 201)

    def test_contact_message_rejects_short_message(self):
        response = self.api.post("/api/contact/", {
            "name": "Visitor", "email": "visitor@example.com", "phone": "",
            "subject": "Hi", "message": "short",
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("message", response.json())

    def test_admission_application_is_accepted(self):
        response = self.api.post("/api/admissions/", {
            "student_name": "Meera Pillai", "date_of_birth": "2012-05-01",
            "grade_applying_for": "10", "previous_school": "",
            "parent_name": "Suresh Pillai", "parent_email": "parent@example.com",
            "parent_phone": "+1 555 010 0100", "address": "12 Sample Road",
            "additional_notes": "",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], "submitted")

    def test_admission_rejects_future_date_of_birth(self):
        future = (date.today() + timedelta(days=365 * 5)).isoformat()
        response = self.api.post("/api/admissions/", {
            "student_name": "Future Kid", "date_of_birth": future,
            "grade_applying_for": "1", "parent_name": "P", "parent_email": "p@example.com",
            "parent_phone": "+1 555 010 0100", "address": "Somewhere",
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("date_of_birth", response.json())


class AvatarUploadTests(BaseApiTest):
    def test_avatar_rejects_non_image_content(self):
        self.authenticate(self.student)
        fake = SimpleUploadedFile("avatar.png", b"<html>not really an image</html>", content_type="image/png")
        response = self.api.patch("/api/auth/me/", {"avatar": fake}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("avatar", response.json())

    def test_avatar_accepts_real_png(self):
        self.authenticate(self.student)
        png = SimpleUploadedFile("avatar.png", make_png_bytes(), content_type="image/png")
        response = self.api.patch("/api/auth/me/", {"avatar": png}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.json()["avatar"])
