from django.urls import path
from . import views

urlpatterns = [
    path("courses/",views.CourseListView.as_view(),name="course-list"),
    path("courses/<int:pk>/",views.CourseDetailView.as_view(),name="course-detail"),
    path("gallery/",views.GalleryImageListView.as_view(),name="gallery-list"),
    path("contact/",views.ContactMessageCreateView.as_view(),name="contact-create"),
    path("admissions/",views.AdmissionApplicationCreateView.as_view(),name="admission-create"),
    path("auth/register/",views.RegisterView.as_view(),name="auth-register"),
    path("auth/login/",views.LoginView.as_view(),name="auth-login"),
    path("auth/logout/",views.LogoutView.as_view(),name="auth-logout"),
    path("auth/me/",views.MeView.as_view(),name="auth-me"),
    path("auth/change-password/",views.ChangePasswordView.as_view(),name="auth-change-password"),
    path("auth/password-reset/",views.PasswordResetRequestView.as_view(),name="auth-password-reset"),
    path("auth/password-reset-confirm/",views.PasswordResetConfirmView.as_view(),name="auth-password-reset-confirm"),
    path("my-courses/",views.MyCoursesView.as_view(),name="my-courses"),
    path("enroll/",views.EnrollView.as_view(),name="enroll"),
    path("courses/<int:pk>/learn/",views.CourseLearnView.as_view(),name="course-learn"),
    path("lessons/<int:pk>/complete/",views.LessonCompleteView.as_view(),name="lesson-complete"),
    path("lesson-files/<int:pk>/download/",views.LessonFileDownloadView.as_view(),name="lesson-file-download"),

]
