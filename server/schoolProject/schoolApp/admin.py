from django.contrib import admin
from .models import AdmissionApplication,ContactMessage,Course,GalleryImage,Enrollment,Profile,Lesson,Subject,LessonFile,LessonProgress


class SubjectInline(admin.TabularInline):
    model=Subject
    extra=1
    fields=("title","order")


class LessonInline(admin.TabularInline):
    model=Lesson
    extra=1
    fields=("title","order","youtube_url")


class LessonFileInline(admin.TabularInline):
    model=LessonFile
    extra=1
    fields=("label","file","order")


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display=("title","stage","duration","price","order")
    list_filter=("stage",)
    ordering=("order","title")
    inlines=[SubjectInline]


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display=("title","course","order")
    list_filter=("course",)
    ordering=("course","order")
    inlines=[LessonInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display=("title","subject","order","youtube_url")
    list_filter=("subject__course",)
    ordering=("subject","order")
    inlines=[LessonFileInline]


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display=("student","lesson","completed_at")
    search_fields=("student__email","student__username","lesson__title")
    readonly_fields=("completed_at",)


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display=("title","category","uploaded_at")
    list_filter=("category",)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display=("name","email","subject","submitted_at","is_read")
    list_filter=("is_read",)
    search_fields=("name","email","subject","message")
    readonly_fields=("submitted_at",)


@admin.register(AdmissionApplication)
class AdmissionApplicationAdmin(admin.ModelAdmin):
    list_display=("student_name","grade_applying_for","parent_name","status","submitted_at")
    list_filter=("status","grade_applying_for")
    search_fields=("student_name","parent_name","parent_email")
    readonly_fields=("submitted_at",)

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display=("student","course","enrolled_at")
    list_filter=("course",)
    search_fields=("student__email","student__username","course__title")
    readonly_fields=("enrolled_at",)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display=("user","phone","avatar")
    search_fields=("user_email","user_username","phone")
