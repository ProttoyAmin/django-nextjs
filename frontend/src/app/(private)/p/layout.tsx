// app/[username]/layout.tsx
export default function UserProfileLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <>
        {children}
      </>
    );
  }