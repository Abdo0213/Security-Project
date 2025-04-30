// components/UserRoleBadge.js
import React from 'react';
import '../assets/Auth.css';

const UserRoleBadge = ({ role }) => {
  const getRoleDisplay = (role) => {
    switch(role) {
      case 'editor': return 'Editor';
      default: return 'User';
    }
  };

  return (
    <span className={`role-badge ${role}`}>
      {getRoleDisplay(role)}
    </span>
  );
};

export default UserRoleBadge;