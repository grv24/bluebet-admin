import React, { useEffect } from "react";
import PublicLayout from "./PublicLayout";
import PrivateLayout from "./private/PrivateLayout";

type LayoutType = "public" | "private";

interface LayoutProps {
  LayoutType: LayoutType;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  LayoutType,
  children,
  title,
  description,
}) => {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      let meta = document.querySelector("meta[name='description']");
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      } else {
        meta.setAttribute("content", description);
      }
    }
  }, [title, description]);

  return LayoutType === "public" ? (
    <PublicLayout>{children}</PublicLayout>
  ) : (
    <PrivateLayout>{children}</PrivateLayout>
  );
};

export default Layout;
