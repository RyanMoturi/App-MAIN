import React, { useEffect, useState } from 'react';

function homePage() {

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Users1</h2>
      <ul className="list-disc list-inside">
        {users.map((user) => (
          <li key={user.id}>{user.name}={user.email}</li>
        ))}
      </ul>
    </div>
  );
}

export default homePage;
