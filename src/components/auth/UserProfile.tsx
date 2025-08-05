import React, { useState } from "react";
import { User, Settings, Lock, LogOut, Edit, Save, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import Button from "../ui/Button";
import { Card, CardHeader, CardContent } from "../ui/Card";
import StatusBadge from "../ui/StatusBadge";

const UserProfile: React.FC = () => {
  const { state, updateProfile, changePassword, logout } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: state.user?.firstName || "",
    lastName: state.user?.lastName || "",
    email: state.user?.email || "",
    username: state.user?.username || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateProfile(profileData);
      setIsEditing(false);
      showSuccess("Profile updated successfully");
    } catch (error) {
      showError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showSuccess("Password changed successfully");
    } catch (error) {
      showError("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess("Logged out successfully");
    } catch (error) {
      showError("Logout failed");
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setProfileData({
      firstName: state.user?.firstName || "",
      lastName: state.user?.lastName || "",
      email: state.user?.email || "",
      username: state.user?.username || "",
    });
  };

  if (!state.user) {
    return <div>Loading...</div>;
  }

  // Function to determine user role status
  const getUserRoleStatus = (role: string) => {
    switch (role) {
      case "Admin":
        return "Admin";
      case "User":
        return "User";
      default:
        return "User";
    }
  };
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>
        <Button variant="destructive" icon={LogOut} onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Profile Information
                    </h3>
                    <p className="text-sm text-gray-600">
                      Update your personal details
                    </p>
                  </div>
                </div>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={X}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      icon={Save}
                      loading={loading}
                      onClick={handleSaveProfile}
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isEditing
                        ? "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isEditing
                        ? "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isEditing
                        ? "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isEditing
                        ? "border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Change Password
                    </h3>
                    <p className="text-sm text-gray-600">
                      Update your account password
                    </p>
                  </div>
                </div>
                {!isChangingPassword && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Lock}
                    onClick={() => setIsChangingPassword(true)}
                  >
                    Change Password
                  </Button>
                )}
              </div>
            </CardHeader>
            {isChangingPassword && (
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button loading={loading} onClick={handleChangePassword}>
                      Update Password
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Account Summary */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Account Summary
                  </h3>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Role
                  </label>
                  <div className="mt-1">
                    <StatusBadge
                      status={getUserRoleStatus(state.user.role)}
                      size="sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Member Since
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(state.user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {state.user.lastLogin && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Last Login
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(state.user.lastLogin).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
