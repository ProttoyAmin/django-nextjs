// app/users/page.tsx
'use client'
import { useState } from "react";
import { searchUsers } from "@/src/libs/auth/actions/user.actions";
import Link from "next/link";

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    
    const result = await searchUsers(query);
    
    if (result.success) {
      setUsers(result.data);
    }
    
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-6">Search Users</h1>
      
      <form onSubmit={handleSearch} className="mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username..."
          className="px-4 py-2 bg-gray-800 text-white rounded mr-2"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          disabled={isSearching}
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <Link 
            key={user.id}
            href={`/${user.username}`}
            className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700"
          >
            <h3 className="text-xl font-bold">{user.username}</h3>
            <p className="text-gray-400">{user.email}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}