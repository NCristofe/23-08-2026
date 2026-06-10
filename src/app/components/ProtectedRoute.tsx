import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { hasPassedAuth, currentUser } = useAuth();

  // Se a senha inicial não foi passada, redireciona para a página de autenticação de senha
  if (!hasPassedAuth) {
    return <Navigate to="/auth" replace />;
  }
  // Se a senha foi passada, mas o usuário não está logado, redireciona para a página de login
  if (hasPassedAuth && currentUser === null) {
    return <Navigate to="/login" replace />;
  }

  // Se ambos os passos foram concluídos, renderiza o conteúdo protegido
  return children;
};

export default ProtectedRoute;