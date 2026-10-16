from PIL import Image
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.conf import settings as dj_settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, permissions,status
from .models import AdmissionApplication, ContactMessage, Course, GalleryImage,Enrollment,Profile,Lesson,LessonFile,LessonProgress
from django.contrib.auth import authenticate, get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import (
    AdmissionApplicationSerializer,
    ContactMessageSerializer,
    CourseSerializer,
    CourseDetailSerializer,
    CourseLearnSerializer,
    GalleryImageSerializer,
    RegisterSerializer,
    UserSerializer,
    EnrollmentSerializer,
    EnrollRequestSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
User = get_user_model()

# Create your views here.


class CourseListView(generics.ListAPIView):
    serializer_class=CourseSerializer

    def get_queryset(self):
        qs=Course.objects.all()
        stage=self.request.query_params.get("stage")
        if stage:
            qs=qs.filter(stage=stage)
        return qs


class CourseDetailView(generics.RetrieveAPIView):
    queryset=Course.objects.prefetch_related("subjects__lessons")
    serializer_class=CourseDetailSerializer


class GalleryImageListView(generics.ListAPIView):
    serializer_class=GalleryImageSerializer

    def get_queryset(self):
        qs=GalleryImage.objects.all()
        category=self.request.query_params.get("category")
        if category:
            qs=qs.filter(category=category)
        return qs


class ContactMessageCreateView(generics.CreateAPIView):
    queryset=ContactMessage.objects.all()
    serializer_class=ContactMessageSerializer
    permission_classes=[permissions.AllowAny]


class AdmissionApplicationCreateView(generics.CreateAPIView):
    queryset=AdmissionApplication.objects.all()
    serializer_class=AdmissionApplicationSerializer
    permission_classes=[permissions.AllowAny]

class RegisterView(APIView):
    permission_classes=[permissions.AllowAny]

    def post(self,request):
        serializer=RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user=serializer.save()
        token,_=Token.objects.get_or_create(user=user)
        return Response(
            {"token":token.key,"user":UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes=[permissions.AllowAny]

    def post(self,request):
        email=(request.data.get("email") or "").strip().lower()
        password=request.data.get("password") or ""
        user=authenticate(request,username=email,password=password)
        if user is None:
            return Response(
                {"detail":"Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        token,_=Token.objects.get_or_create(user=user)
        return Response({"token":token.key,"user":UserSerializer(user).data})


class LogoutView(APIView):
    permission_classes=[IsAuthenticated]

    def post(self,request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


MAX_AVATAR_BYTES = 2 * 1024 * 1024


def _avatar_error(avatar):
    """Return an error message if the uploaded avatar is not a small, real image."""
    if avatar.size > MAX_AVATAR_BYTES:
        return "Avatar must be 2 MB or smaller."
    try:
        with Image.open(avatar) as img:
            img.verify()
    except Exception:
        return "Upload a valid image file (JPG, PNG, GIF or WebP)."
    finally:
        avatar.seek(0)
    return None


class MeView(APIView):
    permission_classes=[IsAuthenticated]

    def get(self,request):
        return Response(UserSerializer(request.user,context={"request":request}).data)

    def patch(self,request):
        user=request.user
        full_name=(request.data.get("full_name") or "").strip()
        email=(request.data.get("email") or "").strip().lower()
        phone=request.data.get("phone")
        avatar=request.FILES.get("avatar")

        if not full_name and not email and phone is None and not avatar:
            return Response(
                {"detail":"No fields were submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if avatar:
            avatar_error=_avatar_error(avatar)
            if avatar_error:
                return Response({"avatar":[avatar_error]},status=status.HTTP_400_BAD_REQUEST)

        if email:
            if User.objects.filter(username__iexact=email).exclude(id=user.id).exists():
                return Response(
                    {"email":["An account with this email already exists."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.email=email
            user.username=email

        if full_name:
            user.first_name=full_name

        if email or full_name:
            user.save()

        if avatar or phone is not None:
            profile,_=Profile.objects.get_or_create(user=user)
            if avatar:
                profile.avatar=avatar
            if phone is not None:
                profile.phone=phone.strip()
            profile.save()

        return Response(UserSerializer(user,context={"request":request}).data)


class PasswordResetRequestView(APIView):
    """Kicks off the 'forgot password' flow: emails a reset link if the account exists."""

    permission_classes=[permissions.AllowAny]

    def post(self,request):
        serializer=PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email=serializer.validated_data["email"]
        user=User.objects.filter(username__iexact=email).first()

        if user is not None:
            uid=urlsafe_base64_encode(force_bytes(user.pk))
            token=default_token_generator.make_token(user)
            frontend_url=getattr(dj_settings,"FRONTEND_URL","http://localhost:5173").rstrip("/")
            reset_link=f"{frontend_url}/reset-password/{uid}/{token}"
            send_mail(
                subject="Reset your BrightPath password",
                message=(
                    f"Hi {user.first_name or 'there'},\n\n"
                    "We received a request to reset the password for your BrightPath account. "
                    f"Click the link below to choose a new one:\n\n{reset_link}\n\n"
                    "This link will expire once used or after a while for your security. "
                    "If you didn't request this, you can safely ignore this email — your "
                    "password will stay the same."
                ),
                from_email=getattr(dj_settings,"DEFAULT_FROM_EMAIL","no-reply@brightpath.local"),
                recipient_list=[user.email],
                fail_silently=True,
            )

        # Always return the same response, whether or not the email exists,
        # so this endpoint can't be used to check which emails are registered.
        return Response(
            {"detail":"If an account with that email exists, we've sent a password reset link."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """Completes the 'forgot password' flow using the uid/token from the emailed link."""

    permission_classes=[permissions.AllowAny]

    def post(self,request):
        serializer=PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uid=serializer.validated_data["uid"]
        token=serializer.validated_data["token"]
        new_password=serializer.validated_data["new_password"]

        try:
            user_id=force_str(urlsafe_base64_decode(uid))
            user=User.objects.get(pk=user_id)
        except (TypeError,ValueError,OverflowError,User.DoesNotExist):
            user=None

        if user is None or not default_token_generator.check_token(user,token):
            return Response(
                {"detail":"This password reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        Token.objects.filter(user=user).delete()  # sign out of any active sessions

        return Response({"detail":"Your password has been reset. You can now log in."})


class ChangePasswordView(APIView):
    permission_classes=[IsAuthenticated]

    def post(self,request):
        serializer=ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user=request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"old_password":["Current password is incorrect."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"detail":"Password updated."})




class MyCoursesView(generics.ListAPIView):
    serializer_class=EnrollmentSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(student=self.request.user).select_related("course")

class EnrollView(APIView):
    permission_classes=[IsAuthenticated]

    def post(self,request):
        serializer=EnrollRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course=get_object_or_404(Course,id=serializer.validated_data["course_id"])
        enrollment,created=Enrollment.objects.get_or_create(student=request.user,course=course)
        return Response(
            EnrollmentSerializer(enrollment).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self,request):
        course_id=request.data.get("course_id")
        Enrollment.objects.filter(student=request.user,course_id=course_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CourseLearnView(APIView):
    """Course → Subjects → Lessons → Files, gated behind an active enrollment."""

    permission_classes=[IsAuthenticated]

    def get(self,request,pk):
        course=get_object_or_404(
            Course.objects.prefetch_related("subjects__lessons__files"),
            id=pk,
        )
        if not Enrollment.objects.filter(student=request.user,course=course).exists():
            return Response(
                {"detail":"You must be enrolled in this course to view its lessons."},
                status=status.HTTP_403_FORBIDDEN,
            )

        completed_lesson_ids=set(
            LessonProgress.objects.filter(
                student=request.user,
                lesson__subject__course=course,
            ).values_list("lesson_id",flat=True)
        )

        serializer=CourseLearnSerializer(
            course,
            context={"completed_lesson_ids":completed_lesson_ids,"request":request},
        )
        return Response(serializer.data)


class LessonCompleteView(APIView):
    """Mark / unmark a lesson complete for the logged-in student."""

    permission_classes=[IsAuthenticated]

    def post(self,request,pk):
        lesson=get_object_or_404(Lesson,id=pk)
        course=lesson.subject.course
        if not Enrollment.objects.filter(student=request.user,course=course).exists():
            return Response(
                {"detail":"You must be enrolled in this course to update progress."},
                status=status.HTTP_403_FORBIDDEN,
            )
        LessonProgress.objects.get_or_create(student=request.user,lesson=lesson)
        return Response({"lesson_id":lesson.id,"completed":True},status=status.HTTP_200_OK)

    def delete(self,request,pk):
        lesson=get_object_or_404(Lesson,id=pk)
        LessonProgress.objects.filter(student=request.user,lesson=lesson).delete()
        return Response({"lesson_id":lesson.id,"completed":False},status=status.HTTP_200_OK)


class LessonFileDownloadView(APIView):
    """Serves a lesson file only if the student is enrolled in its course."""

    permission_classes=[IsAuthenticated]

    def get(self,request,pk):
        lesson_file=get_object_or_404(LessonFile,id=pk)
        course=lesson_file.lesson.subject.course
        if not Enrollment.objects.filter(student=request.user,course=course).exists():
            return Response(
                {"detail":"You must be enrolled in this course to access this file."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not lesson_file.file:
            raise Http404
        return FileResponse(
            lesson_file.file.open("rb"),
            as_attachment=True,
            filename=lesson_file.file.name.rsplit("/",1)[-1],
        )

