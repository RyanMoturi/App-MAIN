import React, { useEffect, useState } from 'react';

function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/users')
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error('Error fetching users:', err));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Users</h2>
      <ul className="list-disc list-inside">
        {users.map((user) => (
          <li key={user.id}>{user.name}={user.email}</li>
        ))}
      </ul>
    </div>
  );
}

export default UserList;
