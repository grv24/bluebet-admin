export interface Route {
  path: string;
  component: React.LazyExoticComponent<React.FC> | React.FC;
  layout: "public" | "private";
  private: boolean;
  title?: string;
  description?: string;
}
