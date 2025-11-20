import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AssistantCard } from '../components/AssistantCard';
import { PackageSelector } from '../components/PackageSelector';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { ErrorState, EmptyState } from '../components/ui/ErrorState';
import { Heading, Text, DisplayText } from '../components/ui/Typography';
import { FloatingParticles, GradientOrb, ParallaxContainer, TextReveal } from '../components/ui/AdvancedEffects';
import { Icon } from '../components/ui/Icon';
import { cn } from '../utils/cn';
import { ApiService } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../hooks/useAuthModal';
import { AuthModal } from '../components/auth/AuthModal';
import { PACKAGE_ALL_PRICING, isBlackFridayActive } from '../config/pricing';
import type { Assistant } from '../types';

export default function Store() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    modalState,
    hideAuthModal,
    switchMode,
    executeIntendedAction,
    requireAuth
  } = useAuthModal();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedPackageType, setSelectedPackageType] = useState<'package_3' | 'package_6' | 'package_all'>('package_3');
  const [showPackageSelector, setShowPackageSelector] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasLoadedRef.current) return;
    
    hasLoadedRef.current = true;
    
    // Debounce to prevent multiple rapid calls
    const timeoutId = setTimeout(() => {
      loadAssistants();
      
      // Check if coming from a specific assistant for future highlighting
      const assistantId = searchParams.get('assistant');
      if (assistantId) {
        // Future feature: highlight specific assistant
      }
    }, 150);
    
    return () => {
      clearTimeout(timeoutId);
      hasLoadedRef.current = false;
    };
  }, [searchParams]);

  const loadAssistants = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const apiService = ApiService.getInstance();
      const result = await apiService.getAssistants(forceRefresh);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar assistentes');
      }

      setAssistants(result.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar assistentes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAssistants(true); // Force refresh
  };

  const handleSubscribe = (assistantId: string) => {
    // Verificar se o usuário está logado antes de prosseguir
    requireAuth(() => {
      // Find the assistant to get its actual price
      const assistant = assistants.find(a => a.id === assistantId);

      navigate('/checkout', {
        state: {
          type: 'individual',
          assistant_id: assistantId,
          subscription_type: 'monthly',
          total_price: assistant?.monthly_price || 39.90
        }
      });
    }, 'Para assinar este assistente, faça login ou crie sua conta');
  };

  const handlePackageSelect = (packageType: 'package_3' | 'package_6' | 'package_all') => {
    setSelectedPackageType(packageType);
    setShowPackageSelector(true);
  };

  const scrollToSection = (sectionId: string) => {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 100; // Account for any fixed header
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
          top: elementPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const [showPackagesModal, setShowPackagesModal] = useState(false);

  const packages = [
    {
      name: 'Pacote Essencial',
      assistants: 3,
      monthlyPrice: 99.90,
      semesterPrice: 499.00,
      discount: 17,
      savings: 19.80,
      popular: false
    },
    {
      name: 'Pacote Profissional',
      assistants: 6,
      monthlyPrice: 179.90,
      semesterPrice: 899.00,
      discount: 25,
      savings: 59.50,
      popular: false
    },
    // BLACK FRIDAY: All assistants package
    ...(isBlackFridayActive() ? [{
      name: 'BLACK FRIDAY - TODOS OS ASSISTENTES',
      assistants: assistants.length,
      totalPrice: PACKAGE_ALL_PRICING.totalPrice,
      installmentPrice: PACKAGE_ALL_PRICING.installmentPrice,
      installmentCount: PACKAGE_ALL_PRICING.installmentCount,
      originalPrice: PACKAGE_ALL_PRICING.originalPrice,
      discount: 80,
      savings: PACKAGE_ALL_PRICING.originalPrice - PACKAGE_ALL_PRICING.totalPrice,
      popular: true,
      limited: true,
      packageType: 'package_all' as const
    }] : [])
  ];

  const filteredAssistants = assistants.filter(assistant => {
    const matchesSearch = assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assistant.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = selectedArea === 'all' || assistant.area === selectedArea;
    
    return matchesSearch && matchesArea;
  });

  if (loading) {
    return <PageLoader message="Carregando loja de assistentes..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar loja"
        message={error}
        onRetry={loadAssistants}
        retryText="Tentar Novamente"
        icon={<Icon name="store" className="w-12 h-12 text-neuro-error" />}
      />
    );
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Background Effects */}
      <FloatingParticles className="opacity-20" count={40} />
      
      {/* Gradient Orbs */}
      <motion.div
        className="absolute top-20 right-10"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <GradientOrb size="lg" color="#2D5A1F" animated />
      </motion.div>
      
      <motion.div
        className="absolute bottom-20 left-10"
        animate={{
          x: [0, -25, 0],
          y: [0, 15, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <GradientOrb size="md" color="#10B981" animated />
      </motion.div>

      <div className="relative z-10 space-y-16">
        {/* Hero Header */}
        <motion.div 
          className="text-center relative overflow-hidden py-20"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Background Pattern - Professional Neural Network */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Animated neural network background */}
            <div className="absolute inset-0">
              {/* Primary network lines */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="neural-grid" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                    <circle cx="60" cy="60" r="2" fill="#2D5A1F" opacity="0.4"/>
                    <circle cx="20" cy="20" r="1.5" fill="#2D5A1F" opacity="0.3"/>
                    <circle cx="100" cy="20" r="1.5" fill="#2D5A1F" opacity="0.3"/>
                    <circle cx="20" cy="100" r="1.5" fill="#2D5A1F" opacity="0.3"/>
                    <circle cx="100" cy="100" r="1.5" fill="#2D5A1F" opacity="0.3"/>
                    <line x1="20" y1="20" x2="60" y2="60" stroke="#2D5A1F" strokeWidth="0.5" opacity="0.2"/>
                    <line x1="100" y1="20" x2="60" y2="60" stroke="#2D5A1F" strokeWidth="0.5" opacity="0.2"/>
                    <line x1="20" y1="100" x2="60" y2="60" stroke="#2D5A1F" strokeWidth="0.5" opacity="0.2"/>
                    <line x1="100" y1="100" x2="60" y2="60" stroke="#2D5A1F" strokeWidth="0.5" opacity="0.2"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#neural-grid)" />
              </svg>
              
              {/* Floating particles */}
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-neuro-primary/20 rounded-full animate-float"></div>
              <div className="absolute top-3/4 left-3/4 w-1.5 h-1.5 bg-green-400/30 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
              <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-neuro-primary/25 rounded-full animate-float" style={{animationDelay: '4s'}}></div>
              <div className="absolute top-1/6 right-1/4 w-1.5 h-1.5 bg-green-500/20 rounded-full animate-float" style={{animationDelay: '1.5s'}}></div>
              
            </div>
          </div>
          
          <motion.div
            className="relative z-10 max-w-6xl mx-auto px-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {/* Innovative Logo Section with Neural Connections */}
            <div className="flex justify-center items-center mb-16 px-4 py-8">
              {/* Main Logo Container */}
              <motion.div 
                className="relative py-8"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, duration: 1, type: "spring", bounce: 0.3 }}
              >
                {/* Outer Ring */}
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44">
                  <div className="absolute inset-0 rounded-full border-2 border-neuro-primary/30 animate-spin" style={{ animationDuration: '20s' }}>
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-neuro-primary rounded-full"></div>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-teal-500 rounded-full"></div>
                  </div>
                  
                  {/* Center Logo */}
                  <motion.div 
                    className="absolute inset-4 sm:inset-6 md:inset-8 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white shadow-2xl"
                    style={{
                      background: `linear-gradient(135deg, #2D5A1F 0%, #4A9A3F 50%, #10B981 100%)`
                    }}
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    transition={{ duration: 0.4, type: "spring" }}
                  >
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-neuro-primary/20 blur-xl scale-150 animate-pulse -z-10"></div>
                    <Icon name="zap" className="w-12 h-12 sm:w-16 sm:h-16 md:w-18 md:h-18 text-white relative z-10" />
                  </motion.div>

                  {/* Floating Neural Nodes */}
                  {[
                    { position: "top-0 left-0", delay: 0.8, icon: "brain" },
                    { position: "top-0 right-0", delay: 1.0, icon: "heart" },
                    { position: "bottom-0 left-0", delay: 1.2, icon: "shield" },
                    { position: "bottom-0 right-0", delay: 1.4, icon: "users" }
                  ].map((node, index) => (
                    <motion.div
                      key={index}
                      className={`absolute w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/25 backdrop-blur-lg rounded-lg sm:rounded-xl border border-white/40 flex items-center justify-center shadow-lg ${node.position} transform -translate-x-1/2 -translate-y-1/2`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: node.delay, duration: 0.5, type: "spring" }}
                      whileHover={{ scale: 1.2, y: -2 }}
                    >
                      <Icon name={node.icon as any} className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-neuro-primary drop-shadow-sm" />
                    </motion.div>
                  ))}
                </div>

                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 176 176">
                  <motion.path
                    d="M 88 88 L 20 20"
                    stroke="#2D5A1F"
                    strokeWidth="1.5"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                  />
                  <motion.path
                    d="M 88 88 L 156 20"
                    stroke="#2D5A1F"
                    strokeWidth="1.5"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.6, duration: 0.8 }}
                  />
                  <motion.path
                    d="M 88 88 L 20 156"
                    stroke="#2D5A1F"
                    strokeWidth="1.5"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.7, duration: 0.8 }}
                  />
                  <motion.path
                    d="M 88 88 L 156 156"
                    stroke="#2D5A1F"
                    strokeWidth="1.5"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.8, duration: 0.8 }}
                  />
                </svg>
              </motion.div>
            </div>

            {/* Revolutionary Title */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-neuro-primary/10 to-green-500/10 border border-neuro-primary/20 mb-4">
                <span className="text-sm font-semibold text-neuro-primary">🚀 Revolucione sua prática clínica</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-neuro-primary via-green-600 to-emerald-500 bg-clip-text text-transparent">
                  NeuroIA Store
                </span>
              </h1>
              
              <div className="relative">
                <motion.div
                  className="text-3xl md:text-4xl font-bold text-neuro-primary"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    background: "linear-gradient(90deg, #2D5A1F, #10B981, #059669, #2D5A1F)",
                    backgroundSize: "300% 100%",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}
                >
                  Assistentes Especializados
                </motion.div>
              </div>
            </motion.div>

            {/* Enhanced Description */}
            <motion.div 
              className="text-center max-w-3xl mx-auto mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <div className="text-xl text-gray-600 leading-relaxed mb-6">
                Descubra uma nova era na prática psicológica com nossos{" "}
                <span className="font-bold text-neuro-primary relative inline-block">
                  {assistants.length} assistentes especializados
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-neuro-primary to-green-500"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                  />
                </span>
                {" "}desenvolvidos especificamente para diferentes áreas.
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  { number: assistants.length.toString(), label: "Assistentes", icon: "brain" },
                  { number: "100%", label: "Especializado", icon: "target" },
                  { number: "24/7", label: "Disponível", icon: "clock" },
                  { number: "∞", label: "Conversas", icon: "messageCircle" }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 + index * 0.1, duration: 0.6 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <Icon name={stat.icon as any} className="w-6 h-6 text-neuro-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-neuro-primary">{stat.number}</div>
                    <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Modern Action Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.8, duration: 0.6 }}
            >
              <Button
                size="lg"
                leftIcon={<Icon name="zap" className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />}
                className="group relative overflow-hidden bg-gradient-to-r from-neuro-primary to-green-600 hover:from-green-600 hover:to-neuro-primary text-white shadow-2xl hover:shadow-neuro-primary/25 transform hover:-translate-y-1 transition-all duration-300"
                onClick={() => scrollToSection('assistants')}
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="font-semibold">Explorar Assistentes</span>
              </Button>

              <Button
                size="lg"
                variant="outline"
                leftIcon={<Icon name="gift" className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                className="group border-2 border-neuro-primary/30 text-neuro-primary hover:bg-neuro-primary hover:text-white backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                onClick={() => setShowPackagesModal(true)}
              >
                <span className="font-semibold">Ver Pacotes</span>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>



        {/* Assistants View */}
        <div id="assistants" className="scroll-mt-20">
        <ParallaxContainer className="space-y-16" speed={0.2}>
            {/* Search and Filters */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-7xl mx-auto px-8"
            >
              <Card variant="glow" className="glass-card border border-neuro-border/30">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Buscar assistantes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="lg"
                        leftIcon={
                          <motion.div
                            animate={{
                              rotate: searchTerm ? 360 : 0
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            <Icon name="search" className="w-4 h-4" />
                          </motion.div>
                        }
                        className="glass-card border border-neuro-border/20 focus:border-neuro-primary/40 transition-all"
                      />
                    </div>
                    <div className="md:w-64 relative">
                      <select
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        className="w-full px-4 py-3 glass-card border border-neuro-border/20 focus:border-neuro-primary/40 rounded-xl bg-transparent text-neuro-gray-700 focus:outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="all">Todas as áreas</option>
                        <option value="Psicologia">Psicologia</option>
                        <option value="Psicopedagogia">Psicopedagogia</option>
                        <option value="Fonoaudiologia">Fonoaudiologia</option>
                        <option value="Neuromodulação">Neuromodulação</option>
                        <option value="Terapia Ocupacional">Terapia Ocupacional</option>
                      </select>
                      <Icon name="chevronDown" className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neuro-gray-400 pointer-events-none" />
                    </div>
                    
                    {/* Botão de Refresh */}
                    <div className="flex justify-center md:justify-start">
                      <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="glass-card border border-neuro-border/20 hover:border-neuro-primary/40 transition-all"
                        leftIcon={
                          <Icon 
                            name={loading ? "loader" : "refreshCw"} 
                            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                          />
                        }
                      >
                        {loading ? 'Atualizando...' : 'Atualizar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Assistants Grid */}
            {filteredAssistants.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto px-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                {filteredAssistants.map((assistant, index) => (
                  <motion.div
                    key={assistant.id}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.6 + index * 0.1, 
                      duration: 0.6,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    viewport={{ once: true }}
                  >
                    <AssistantCard
                      assistant={assistant}
                      isSubscribed={false}
                      onSubscribe={handleSubscribe}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <EmptyState
                title="Nenhum assistente encontrado"
                message="Tente ajustar seus filtros ou termo de busca para encontrar o assistente ideal"
                icon={<Icon name="search" className="w-12 h-12 text-neuro-gray-400" />}
                action={{
                  label: "Limpar Filtros",
                  onClick: () => {
                    setSearchTerm('');
                    setSelectedArea('all');
                  }
                }}
              />
            )}
        </ParallaxContainer>
        </div>
      </div>

      {/* Packages Modal */}
      {showPackagesModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowPackagesModal(false)}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-gray-100 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Escolha seu Pacote</h2>
                <p className="text-gray-600 mt-1">Economize assinando múltiplos assistentes</p>
              </div>
              <button
                onClick={() => setShowPackagesModal(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <Icon name="x" className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {packages.map((pkg, index) => {
                  const isPopular = pkg.popular;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="perspective-1000"
                    >
                      <Card 
                        variant="glow" 
                        className={cn(
                          "relative transform-gpu transition-all duration-500 group overflow-hidden h-full",
                          isPopular 
                            ? "border-neuro-primary/40 shadow-lg bg-gradient-to-br from-neuro-primary/5 to-green-50" 
                            : "border-neuro-border/30 hover:border-neuro-primary/40"
                        )}
                      >
                        <CardContent className="text-center p-8 relative z-10">
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.2, duration: 0.6 }}
                          >
                            <div className={cn(
                              "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl",
                              isPopular 
                                ? "bg-gradient-to-br from-neuro-primary to-green-600" 
                                : "bg-gradient-to-br from-gray-600 to-gray-800"
                            )}>
                              <Icon name="package" className="w-10 h-10 text-white" />
                            </div>
                            
                            {pkg.limited && (
                              <div className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-xs font-bold mb-4 animate-pulse">
                                🔥 OFERTA LIMITADA
                              </div>
                            )}

                            <h3 className="text-2xl font-bold text-neuro-gray-900 mb-2">
                              {pkg.limited ? 'TODOS os Assistentes' : `${pkg.assistants} Assistentes`}
                            </h3>

                            <p className="text-neuro-gray-600 mb-6">
                              {pkg.limited
                                ? `Acesso completo a todos os ${pkg.assistants} assistentes especializados`
                                : `Escolha ${pkg.assistants} assistentes especializados`}
                            </p>

                            <div className="mb-8">
                              {pkg.installmentPrice ? (
                                // Package All - Installment pricing with Black Friday
                                <>
                                  <div className="flex items-baseline justify-center mb-2">
                                    <span className="text-4xl font-bold text-green-600">
                                      {pkg.installmentCount}x R$ {pkg.installmentPrice.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                  <div className="text-sm text-neuro-gray-500 mb-1">
                                    Total: R$ {pkg.totalPrice.toFixed(2).replace('.', ',')}
                                  </div>
                                  {pkg.originalPrice && pkg.originalPrice > pkg.totalPrice && (
                                    <div className="text-sm text-neuro-gray-400 line-through mb-1">
                                      De R$ {pkg.originalPrice.toFixed(2).replace('.', ',')}
                                    </div>
                                  )}
                                  <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold mt-3">
                                    <Icon name="percentage" className="w-4 h-4 mr-1" />
                                    Economize R$ {pkg.savings.toFixed(2).replace('.', ',')}
                                  </div>
                                </>
                              ) : (
                                // Regular packages - Monthly/Semester pricing
                                <>
                                  <div className="flex items-baseline justify-center mb-2">
                                    <span className="text-4xl font-bold text-neuro-primary">
                                      R$ {pkg.monthlyPrice?.toFixed(2).replace('.', ',') || '0,00'}
                                    </span>
                                    <span className="text-neuro-gray-500 ml-2">/mês</span>
                                  </div>
                                  <div className="text-sm text-neuro-gray-500">
                                    ou R$ {pkg.semesterPrice}/semestre
                                  </div>
                                  <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold mt-3">
                                    <Icon name="percentage" className="w-4 h-4 mr-1" />
                                    {pkg.discount}% economia
                                  </div>
                                </>
                              )}
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.4, duration: 0.6 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              size="lg"
                              leftIcon={<Icon name="gift" className="w-5 h-5 text-white group-hover/btn:scale-110 transition-transform" />}
                              rightIcon={<Icon name="arrowRight" className="w-4 h-4 text-white group-hover/btn:translate-x-1 transition-transform" />}
                              className="w-full relative overflow-hidden group/btn glow-hover shadow-lg"
                              onClick={() => {
                                setShowPackagesModal(false);
                                const packageType = pkg.packageType || (pkg.assistants === 3 ? 'package_3' : 'package_6');
                                handlePackageSelect(packageType);
                              }}
                              style={{
                                background: isPopular 
                                  ? `linear-gradient(135deg, #10B981 0%, #059669 100%)`
                                  : `linear-gradient(135deg, #2D5A1F 0%, #4A9A3F 100%)`,
                                boxShadow: isPopular 
                                  ? `0 6px 20px rgba(16, 185, 129, 0.4)` 
                                  : `0 6px 20px rgba(45, 90, 31, 0.4)`
                              }}
                            >
                              <span className="font-semibold">
                                {pkg.limited ? 'Garantir Acesso Completo' : `Escolher ${pkg.assistants} Assistentes`}
                              </span>
                            </Button>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm">
                  💡 <strong>Dica:</strong> Você poderá escolher quais assistentes incluir no seu pacote na próxima etapa
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Package Selector Modal */}
      {showPackageSelector && (
        <PackageSelector
          packageType={selectedPackageType === 'package_3' ? 3 : selectedPackageType === 'package_6' ? 6 : 'all'}
          onClose={() => setShowPackageSelector(false)}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        modalState={modalState}
        onClose={hideAuthModal}
        onModeSwitch={switchMode}
        onSuccess={executeIntendedAction}
      />
    </div>
  );
}