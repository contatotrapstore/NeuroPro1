import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import InstitutionModernLayout from './InstitutionModernLayout';
import InstitutionPublicLayout from './InstitutionPublicLayout';

const InstitutionConditionalLayout: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const {
    institution,
    authenticationComplete,
    isInstitutionUser,
    loadInstitution,
    institutionLoaded
  } = useInstitution();

  // Definir rotas públicas que não precisam de autenticação
  const publicRoutes = [
    `/i/${slug}`,
    `/i/${slug}/store`,
    `/i/${slug}/dashboard`
  ];

  const isPublicRoute = publicRoutes.some(route =>
    location.pathname === route || location.pathname.startsWith(route + '/')
  );

  // Carregar instituição automaticamente
  useEffect(() => {
    if (slug && !institutionLoaded) {
      loadInstitution(slug);
    }
  }, [slug, loadInstitution, institutionLoaded]);

  // Determinar qual layout usar
  const shouldUsePublicLayout = isPublicRoute && (!user || !authenticationComplete || !isInstitutionUser);

  if (shouldUsePublicLayout) {
    return <InstitutionPublicLayout />;
  } else {
    return <InstitutionModernLayout />;
  }
};

export default InstitutionConditionalLayout;