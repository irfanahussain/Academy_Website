from django.conf import settings
from django.db import models
from django.core.validators import RegexValidator
# Create your models here.


phone_validator=RegexValidator(
    regex=r"^\+?[0-9 ()\-]{7,20}$",
    message="Enter a valid phone number.",
)


class Course(models.Model):
    STAGE_CHOICES=[
        ("primary","Foundation (Class 8-10)"),
        ("middle","Class 11 & 12"),
        ("high","Competitive / Dropper Batch"),
    ]

    title=models.CharField(max_length=120)
    stage=models.CharField(max_length=10,choices=STAGE_CHOICES)
    summary=models.CharField(max_length=280)
    description=models.TextField()
    duration=models.CharField(max_length=60)
    image=models.ImageField(upload_to="courses/",blank=True,null=True)
    order=models.PositiveIntegerField(default=0)
    price=models.DecimalField(max_digits=8,decimal_places=2,default=0)
    features=models.JSONField(default=list,blank=True,help_text="List of short feature strings shown on the course detail page.")
    requirements=models.JSONField(default=list,blank=True,help_text="List of short requirement strings shown on the course detail page.")

    class Meta:
        ordering=["order","title"]

    def __str__(self):
        return self.title
class Subject(models.Model):
    course=models.ForeignKey(Course,on_delete=models.CASCADE,related_name="subjects")
    title=models.CharField(max_length=150)
    order=models.PositiveIntegerField(default=0)

    class Meta:
        ordering=["order","id"]

    def __str__(self):
        return f"{self.course.title} — {self.title}"


class Lesson(models.Model):
    subject=models.ForeignKey(Subject,on_delete=models.CASCADE,related_name="lessons")
    title=models.CharField(max_length=150)
    order=models.PositiveIntegerField(default=0)
    youtube_url=models.URLField(blank=True,help_text="YouTube video URL for this lesson (optional).")

    class Meta:
        ordering=["order","id"]

    def __str__(self):
        return f"{self.subject.title} — {self.title}"


class LessonFile(models.Model):
    lesson=models.ForeignKey(Lesson,on_delete=models.CASCADE,related_name="files")
    label=models.CharField(max_length=150,help_text="Display name, e.g. 'Chapter 3 notes.pdf'")
    file=models.FileField(upload_to="lesson_files/")
    order=models.PositiveIntegerField(default=0)

    class Meta:
        ordering=["order","id"]

    def __str__(self):
        return f"{self.lesson.title} — {self.label}"


class LessonProgress(models.Model):
    student=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="lesson_progress")
    lesson=models.ForeignKey(Lesson,on_delete=models.CASCADE,related_name="progress_entries")
    completed_at=models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together=("student","lesson")
        ordering=["-completed_at"]

    def __str__(self):
        return f"{self.student} completed {self.lesson}"


class GalleryImage(models.Model):
    CATEGORY_CHOICES = [
        ("campus","Campus"),
        ("academics","Academics"),
        ("sports","Sports"),
        ("events","Events"),
        ("arts","Arts"),
    ]

    title=models.CharField(max_length=120)
    category=models.CharField(max_length=20,choices=CATEGORY_CHOICES,default="campus")
    image=models.ImageField(upload_to="gallery/")
    caption=models.CharField(max_length=200, blank=True)
    uploaded_at=models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering=["-uploaded_at"]

    def __str__(self):
        return self.title


class ContactMessage(models.Model):
    name=models.CharField(max_length=120)
    email=models.EmailField()
    phone=models.CharField(max_length=20, blank=True, validators=[phone_validator])
    subject=models.CharField(max_length=150)
    message=models.TextField()
    submitted_at=models.DateTimeField(auto_now_add=True)
    is_read=models.BooleanField(default=False)

    class Meta:
        ordering=["-submitted_at"]

    def __str__(self):
        return f"{self.name}—{self.subject}"


class AdmissionApplication(models.Model):
    GRADE_CHOICES=[(str(g),f"Grade {g}") for g in range(1, 13)] + [("K","Kindergarten")]
    STATUS_CHOICES=[
        ("submitted","Submitted"),
        ("under_review","Under Review"),
        ("accepted","Accepted"),
        ("waitlisted","Waitlisted"),
        ("declined","Declined"),
    ]

    student_name=models.CharField(max_length=150)
    date_of_birth=models.DateField()
    grade_applying_for=models.CharField(max_length=2,choices=GRADE_CHOICES)
    previous_school=models.CharField(max_length=200,blank=True)

    parent_name=models.CharField(max_length=150)
    parent_email=models.EmailField()
    parent_phone=models.CharField(max_length=20,validators=[phone_validator])
    address=models.TextField()

    additional_notes=models.TextField(blank=True)

    status=models.CharField(max_length=20,choices=STATUS_CHOICES,default="submitted")
    submitted_at=models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering=["-submitted_at"]

    def __str__(self):
        return f"{self.student_name} (Grade {self.grade_applying_for})"


    
class Enrollment(models.Model):
    student=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="enrollments")
    course=models.ForeignKey(Course,on_delete=models.CASCADE,related_name="enrollments")
    enrolled_at=models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering=["-enrolled_at"]
        unique_together=("student","course")

    def __str__(self):
        return f"{self.student} → {self.course}"


class Profile(models.Model):
    user=models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="profile")
    avatar=models.ImageField(upload_to="avatars/",blank=True,null=True)
    phone=models.CharField(max_length=20,blank=True,validators=[phone_validator])


    def __str__(self):
        return f"{self.user}'s profile"


from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save,sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender,instance,created,**kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)
