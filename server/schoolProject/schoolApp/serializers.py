from datetime import date
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import AdmissionApplication,ContactMessage,Course,GalleryImage,Enrollment,Profile,Lesson,Subject,LessonFile,LessonProgress

User=get_user_model()


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model=Course
        fields=["id","title","stage","summary","description","duration","image","price"]

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model=Lesson
        fields=["id","title","order"]


class SubjectSerializer(serializers.ModelSerializer):
    lessons=LessonSerializer(many=True,read_only=True)

    class Meta:
        model=Subject
        fields=["id","title","order","lessons"]


class CourseDetailSerializer(serializers.ModelSerializer):
    subjects=SubjectSerializer(many=True,read_only=True)

    class Meta:
        model=Course
        fields=[
            "id","title","stage","summary","description","duration","image",
            "price","features","requirements","subjects",
        ]


class LessonFileSerializer(serializers.ModelSerializer):
    download_url=serializers.SerializerMethodField()

    class Meta:
        model=LessonFile
        fields=["id","label","order","download_url"]

    def get_download_url(self,obj):
        request=self.context.get("request")
        path=f"/api/lesson-files/{obj.id}/download/"
        return request.build_absolute_uri(path) if request else path


class LessonLearnSerializer(serializers.ModelSerializer):
    files=LessonFileSerializer(many=True,read_only=True)
    completed=serializers.SerializerMethodField()

    class Meta:
        model=Lesson
        fields=["id","title","order","youtube_url","files","completed"]

    def get_completed(self,obj):
        completed_ids=self.context.get("completed_lesson_ids",set())
        return obj.id in completed_ids


class SubjectLearnSerializer(serializers.ModelSerializer):
    lessons=LessonLearnSerializer(many=True,read_only=True)

    class Meta:
        model=Subject
        fields=["id","title","order","lessons"]


class CourseLearnSerializer(serializers.ModelSerializer):
    subjects=SubjectLearnSerializer(many=True,read_only=True)
    progress=serializers.SerializerMethodField()

    class Meta:
        model=Course
        fields=["id","title","stage","duration","subjects","progress"]

    def get_progress(self,obj):
        completed_ids=self.context.get("completed_lesson_ids",set())
        total=0
        completed=0
        for subject in obj.subjects.all():
            for lesson in subject.lessons.all():
                total+=1
                if lesson.id in completed_ids:
                    completed+=1
        percent=round((completed/total)*100) if total else 0
        return {"completed":completed,"total":total,"percent":percent}


class LessonCompleteResponseSerializer(serializers.Serializer):
    lesson_id=serializers.IntegerField()
    completed=serializers.BooleanField()


class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model=GalleryImage
        fields=["id","title","category","image","caption","uploaded_at"]


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model=ContactMessage
        fields=["id","name","email","phone","subject","message","submitted_at"]
        read_only_fields=["id","submitted_at"]

    def validate_message(self,value):
        if len(value.strip())<10:
            raise serializers.ValidationError("Message must be at least 10 characters.")
        return value


class AdmissionApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionApplication
        fields = [
            "id","student_name","date_of_birth","grade_applying_for","previous_school","parent_name","parent_email","parent_phone","address","additional_notes","status","submitted_at",
        ]
        read_only_fields=["id", "status", "submitted_at"]

    def validate_date_of_birth(self,value):
        if value>=date.today():
            raise serializers.ValidationError("Date of birth must be in the past.")
        age=(date.today()-value).days//365
        if age>19:
            raise serializers.ValidationError("Please check the date of birth entered.")
        return value


class UserSerializer(serializers.ModelSerializer):
    full_name=serializers.SerializerMethodField()
    avatar=serializers.SerializerMethodField()
    phone=serializers.SerializerMethodField()

    class Meta:
        model=User
        fields=["id","email","full_name","avatar","phone"]

    def get_full_name(self,obj):
        return obj.first_name or obj.email.split("@")[0]

    def get_avatar(self,obj):
        profile=Profile.objects.filter(user=obj).first()
        if not profile or not profile.avatar:
            return None
        request=self.context.get("request")
        url=profile.avatar.url
        return request.build_absolute_uri(url) if request else url

    def get_phone(self,obj):
        profile=Profile.objects.filter(user=obj).first()
        return profile.phone if profile else ""


class ChangePasswordSerializer(serializers.Serializer):
    old_password=serializers.CharField(write_only=True)
    new_password=serializers.CharField(write_only=True,min_length=8)

    def validate_new_password(self,value):
        validate_password(value)
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email=serializers.EmailField()

    def validate_email(self,value):
        return value.strip().lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid=serializers.CharField()
    token=serializers.CharField()
    new_password=serializers.CharField(write_only=True,min_length=8)

    def validate_new_password(self,value):
        validate_password(value)
        return value


class RegisterSerializer(serializers.ModelSerializer):
    email=serializers.EmailField()
    password=serializers.CharField(write_only=True,min_length=8)
    full_name=serializers.CharField(write_only=True,max_length=150)

    class Meta:
        model=User
        fields=["email","password","full_name"]

    def validate_email(self,value):
        value=value.strip().lower()
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_password(self,value):
        validate_password(value)
        return value

    def create(self,validated_data):
        full_name=validated_data.pop("full_name").strip()
        email=validated_data["email"]
        user=User(username=email,email=email,first_name=full_name)
        user.set_password(validated_data["password"])
        user.save()
        return user
    
class EnrollmentSerializer(serializers.ModelSerializer):
    course=CourseSerializer(read_only=True)
    progress=serializers.SerializerMethodField()

    class Meta:
        model=Enrollment
        fields=["id","course","enrolled_at","progress"]

    def get_progress(self,obj):
        lessons=Lesson.objects.filter(subject__course=obj.course)
        total=lessons.count()
        if not total:
            return {"completed":0,"total":0,"percent":0}
        completed=LessonProgress.objects.filter(student=obj.student,lesson__in=lessons).count()
        return {"completed":completed,"total":total,"percent":round((completed/total)*100)}

class EnrollRequestSerializer(serializers.Serializer):
    course_id=serializers.IntegerField()

    def validate_course_id(self,value):
        if not Course.objects.filter(id=value).exists():
            raise serializers.ValidationError("This course doesn't exist.")
        return value
