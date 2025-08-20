const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <main className="flex flex-col items-center min-w-screen justify-center h-screen">
    {children}
  </main>
);
export default PublicLayout;
