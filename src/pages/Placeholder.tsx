import { Helmet } from "react-helmet-async";
import AppHeader from "@/components/layout/AppHeader";

const Placeholder = () => {
  return (
    <>
      <Helmet>
        <title>The Hyper-Local Pulse</title>
        <meta name="description" content="A modern toolkit for real estate agents to generate hyper-local content." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/'} />
      </Helmet>
      
    </>
  );
};

export default Placeholder;
