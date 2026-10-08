const Profile = () => {
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    user = {};
  }

  return (
    <div>
      <h1>Profile</h1>
      <div className="profile-card">
        <h2>{user.name || 'User'}</h2>
        <p><strong>Email:</strong> {user.email || 'Not available'}</p>
        <p><strong>Role:</strong> {user.role || 'Not available'}</p>
      </div>
    </div>
  );
};

export default Profile;