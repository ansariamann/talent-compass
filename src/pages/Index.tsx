import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Redirect to candidates page as the default HR dashboard view
const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/candidates', { replace: true });
  }, [navigate]);

  return null;
};

export default Index;
