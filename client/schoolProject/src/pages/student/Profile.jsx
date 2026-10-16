import { useState } from "react";
import { useAuth } from "../../AuthContext.jsx";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function Profile() {
  const { user, updateAvatar, updateProfileDetails, changeAccountPassword } = useAuth();

  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const initial = (user?.full_name || user?.email || "S").charAt(0).toUpperCase();

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setAvatarError("Image must be smaller than 5MB.");
      return;
    }

    setAvatarError("");
    setSavingAvatar(true);
    try {
      await updateAvatar(file);
    } catch (err) {
      setAvatarError(err?.data?.avatar?.[0] || "Couldn't upload the photo. Try again.");
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setSavingProfile(true);
    try {
      await updateProfileDetails({ phone, email });
      setProfileSuccess("Profile updated.");
    } catch (err) {
      setProfileError(
        err?.data?.email?.[0] || err?.data?.detail || "Couldn't save your changes. Try again."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    setSavingPassword(true);
    try {
      await changeAccountPassword({ oldPassword, newPassword });
      setPasswordSuccess("Password changed.");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(
        err?.data?.old_password?.[0] ||
          err?.data?.new_password?.[0] ||
          "Couldn't change your password."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <>
      <div className="student__header">
        <p className="eyebrow">Profile</p>
        <h1>My Profile</h1>
      </div>

      <div className="profile-hero">
        <div className="profile-hero__avatar-wrap">
          <span className="student__avatar student__avatar--lg" aria-hidden="true">
            {user?.avatar ? <img src={user.avatar} alt="" /> : initial}
          </span>
          <label htmlFor="avatar-upload" className="profile-hero__edit" title="Change photo">
            ✎
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={savingAvatar}
            hidden
          />
        </div>
        <p className="profile-hero__name">{user?.full_name}</p>
        <p className="profile-hero__email">{user?.email}</p>
        {savingAvatar && <p className="state-message">Uploading photo…</p>}
        {avatarError && <p className="error">{avatarError}</p>}
      </div>

      <form className="profile-card" onSubmit={handleProfileSubmit}>
        <h2>My Profile</h2>

        <label className="profile-field">
          <span>Phone Number</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="enter your mobile number"
          />
        </label>

        <label className="profile-field">
          <span>Email Address</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        {profileError && <p className="error">{profileError}</p>}
        {profileSuccess && <p className="success">{profileSuccess}</p>}

        <button type="submit" className="button button--primary button--sm" disabled={savingProfile}>
          {savingProfile ? "Saving…" : "Update"}
        </button>
      </form>

      <div className="profile-card">
        <div className="profile-card__row">
          <h2>Password</h2>
          <button
            type="button"
            className="button button--ghost button--sm"
            onClick={() => setShowPasswordForm((v) => !v)}
          >
            {showPasswordForm ? "Cancel" : "Change password"}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordSubmit}>
            <label className="profile-field">
              <span>Current password</span>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </label>
            <label className="profile-field">
              <span>New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>

            {passwordError && <p className="error">{passwordError}</p>}
            {passwordSuccess && <p className="success">{passwordSuccess}</p>}

            <button
              type="submit"
              className="button button--primary button--sm"
              disabled={savingPassword}
            >
              {savingPassword ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
