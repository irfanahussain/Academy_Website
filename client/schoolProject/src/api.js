const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const TOKEN_KEY = "brightpath_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Token ${token}`;

  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers,
  });

  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error("Request failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function getCourses(stage) {
  const query = stage ? `stage=${encodeURIComponent(stage)}` : "";
  return request(`/courses/${query}`);
}

export function getCourseDetail(id) {
  return request(`/courses/${id}/`);
}

export function getGalleryImages(category) {
  const query = category ? `category=${encodeURIComponent(category)}` : "";
  return request(`/gallery/${query}`);
}

export function submitContactMessage(payload) {
  return request(`/contact/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitAdmissionApplication(payload) {
  return request(`/admissions/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerAccount(payload) {
  return request(`/auth/register/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginAccount(payload) {
  return request(`/auth/login/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logoutAccount() {
  return request(`/auth/logout/`, { method: "POST" });
}

export function fetchCurrentUser() {
  return request(`/auth/me/`);
}

export async function updateProfile({ fullName, email, phone, avatar } = {}) {
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Token ${token}`;

  const formData = new FormData();
  if (fullName !== undefined) formData.append("full_name", fullName);
  if (email !== undefined) formData.append("email", email);
  if (phone !== undefined) formData.append("phone", phone);
  if (avatar) formData.append("avatar", avatar);

  const res = await fetch(`${BASE_URL}/api/auth/me/`, {
    method: "PATCH",
    headers, // no Content-Type: the browser sets the multipart boundary itself
    body: formData,
  });

  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error("Request failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function requestPasswordReset(email) {
  return request(`/auth/password-reset/`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function confirmPasswordReset({ uid, token, newPassword }) {
  return request(`/auth/password-reset-confirm/`, {
    method: "POST",
    body: JSON.stringify({ uid, token, new_password: newPassword }),
  });
}

export function changePassword({ oldPassword, newPassword }) {
  return request(`/auth/change-password/`, {
    method: "POST",
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
}

export function getMyCourses() {
  return request(`/my-courses/`);
}

export function enrollInCourse(courseId) {
  return request(`/enroll/`, {
    method: "POST",
    body: JSON.stringify({ course_id: courseId }),
  });
}

export function unenrollFromCourse(courseId) {
  return request(`/enroll/`, {
    method: "DELETE",
    body: JSON.stringify({ course_id: courseId }),
  });
}

export function getCourseLearn(courseId) {
  return request(`/courses/${courseId}/learn/`);
}

export function markLessonComplete(lessonId) {
  return request(`/lessons/${lessonId}/complete/`, { method: "POST" });
}

export function markLessonIncomplete(lessonId) {
  return request(`/lessons/${lessonId}/complete/`, { method: "DELETE" });
}

export async function downloadLessonFile(url, filename) {
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Token ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const error = new Error("Download failed");
    error.status = res.status;
    throw error;
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename || "download";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}