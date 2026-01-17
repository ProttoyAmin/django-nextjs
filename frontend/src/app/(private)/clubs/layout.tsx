// app/(private)/[username]/clubs/[id]/layout.tsx
import Guard from "./components/Guard";

export default function ClubLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  return (
    <>
      {/* <Guard> */}
      {children}
      {/* </Guard> */}
      {modal}
    </>
  );
}
