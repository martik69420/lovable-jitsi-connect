
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/auth';

const Table = () => {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div>
        <h1>Table Page</h1>
        {user ? (
          <p>Welcome, {user.displayName}!</p>
        ) : (
          <p>Please log in to see the table.</p>
        )}
      </div>
    </AppLayout>
  );
};

export default Table;
