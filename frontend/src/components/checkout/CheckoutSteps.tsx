import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Heading, Text } from '../ui/Typography';
import { Icon } from '../ui/Icon';
import { cn } from '../../utils/cn';

interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  color_theme: string;
  monthly_price: number;
  semester_price: number;
}

interface CheckoutData {
  type: 'individual' | 'package';
  assistant_id?: string;
  package_type?: 'package_3' | 'package_6';
  subscription_type: 'monthly' | 'semester';
  selected_assistants?: string[];
  total_price: number;
}

interface CustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  mobilePhone: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  complement: string;
  province: string;
  city: string;
  state: string;
}

interface CardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

// Review Step Component
export const ReviewStep: React.FC<{
  checkoutData: CheckoutData;
  assistants: Assistant[];
  getCurrentAssistant: () => Assistant | null;
  getSelectedAssistants: () => Assistant[];
  formatCurrency: (value: number) => string;
}> = ({ checkoutData, assistants, getCurrentAssistant, getSelectedAssistants, formatCurrency }) => {
  const currentAssistant = getCurrentAssistant();
  const selectedAssistants = getSelectedAssistants();

  return (
    <Card variant="glow" className="glass-card border border-neuro-border/30">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <motion.div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)`
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Icon name="shoppingCart" className="w-5 h-5" />
          </motion.div>
          <div>
            <h3 className="font-bold text-neuro-gray-900">Revisão do Pedido</h3>
            <p className="text-sm text-neuro-gray-600 font-normal">Confirme os detalhes da sua assinatura</p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Order Type */}
        <div className="glass-card p-4 rounded-xl border border-neuro-border/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg"
                style={{
                  background: checkoutData.type === 'individual' 
                    ? `linear-gradient(135deg, #2D5A1F 0%, #4A9A3F 100%)`
                    : `linear-gradient(135deg, #F59E0B 0%, #D97706 100%)`
                }}
                whileHover={{ scale: 1.1 }}
              >
                <Icon name={checkoutData.type === 'individual' ? 'user' : 'package'} className="w-4 h-4" />
              </motion.div>
              <div>
                <Text weight="semibold" color="default">
                  {checkoutData.type === 'individual' ? 'Assinatura Individual' : 'Pacote de Assistentes'}
                </Text>
                <Text size="sm" color="muted">
                  {checkoutData.subscription_type === 'monthly' ? 'Mensal' : 'Semestral'}
                </Text>
              </div>
            </div>
            
            <div className="text-right">
              <Text size="lg" weight="bold" color="primary">
                {formatCurrency(checkoutData.total_price)}
              </Text>
              <Text size="sm" color="muted">
                /{checkoutData.subscription_type === 'monthly' ? 'mês' : 'semestre'}
              </Text>
            </div>
          </div>
        </div>

        {/* Selected Items */}
        <div className="space-y-4">
          {checkoutData.type === 'individual' && currentAssistant ? (
            <motion.div
              className="glass-card p-4 rounded-xl border border-neuro-border/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2, scale: 1.01 }}
            >
              <div className="flex items-center space-x-4">
                <motion.div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${currentAssistant.color_theme} 0%, ${currentAssistant.color_theme}CC 100%)`
                  }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Icon name="brain" className="w-6 h-6" />
                </motion.div>
                
                <div className="flex-1">
                  <Text weight="semibold" color="default">
                    {currentAssistant.name}
                  </Text>
                  <Text size="sm" color="muted" className="line-clamp-2">
                    {currentAssistant.description}
                  </Text>
                </div>
                
                <div className="text-right">
                  <Text weight="semibold" color="primary">
                    {formatCurrency(checkoutData.subscription_type === 'monthly' 
                      ? currentAssistant.monthly_price 
                      : currentAssistant.semester_price
                    )}
                  </Text>
                </div>
              </div>
            </motion.div>
          ) : checkoutData.type === 'package' && selectedAssistants.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <Text weight="semibold" color="default">
                  Assistentes Selecionados ({selectedAssistants.length})
                </Text>
                <div className="inline-flex items-center px-3 py-1 bg-neuro-success/10 text-neuro-success rounded-full text-sm font-semibold">
                  <Icon name="percentage" className="w-4 h-4 mr-1" />
                  {checkoutData.package_type === 'package_6' ? '25% OFF' : '17% OFF'}
                </div>
              </div>
              
              {selectedAssistants.map((assistant, index) => (
                <motion.div
                  key={assistant.id}
                  className="glass-card p-3 rounded-lg border border-neuro-border/20"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4, scale: 1.01 }}
                >
                  <div className="flex items-center space-x-3">
                    <motion.div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${assistant.color_theme} 0%, ${assistant.color_theme}CC 100%)`
                      }}
                    >
                      <Icon name="brain" className="w-4 h-4" />
                    </motion.div>
                    
                    <div className="flex-1">
                      <Text size="sm" weight="semibold" color="default">
                        {assistant.name}
                      </Text>
                    </div>
                    
                    <Icon name="check" className="w-4 h-4 text-neuro-success" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Benefits */}
        <div className="glass-card p-4 rounded-xl border border-neuro-border/20">
          <Text weight="semibold" color="default" className="mb-3">
            ✨ Incluído na sua assinatura:
          </Text>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: 'message', text: 'Chat ilimitado' },
              { icon: 'clock', text: 'Histórico completo' },
              { icon: 'headphones', text: 'Suporte prioritário' },
              { icon: 'shield', text: 'Dados seguros' }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Icon name={benefit.icon as any} className="w-4 h-4 text-neuro-success" />
                <Text size="sm" color="muted">
                  {benefit.text}
                </Text>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Customer Data Step Component
export const CustomerDataStep: React.FC<{
  customerData: CustomerData;
  onInputChange: (field: keyof CustomerData, value: string) => void;
}> = ({ customerData, onInputChange }) => {
  return (
    <Card variant="glow" className="glass-card border border-neuro-border/30">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <motion.div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, #10B981 0%, #059669 100%)`
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Icon name="user" className="w-5 h-5" />
          </motion.div>
          <div>
            <h3 className="font-bold text-neuro-gray-900">Dados Pessoais</h3>
            <p className="text-sm text-neuro-gray-600 font-normal">Preencha suas informações</p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neuro-gray-700 mb-2">
                Nome Completo *
              </label>
              <Input
                value={customerData.name}
                onChange={(e) => onInputChange('name', e.target.value)}
                placeholder="Seu nome completo"
                className="glass-card border-neuro-border/50 focus:border-neuro-primary/60"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neuro-gray-700 mb-2">
                E-mail *
              </label>
              <Input
                type="email"
                value={customerData.email}
                onChange={(e) => onInputChange('email', e.target.value)}
                placeholder="seu@email.com"
                className="glass-card border-neuro-border/50 focus:border-neuro-primary/60"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neuro-gray-700 mb-2">
                CPF/CNPJ *
              </label>
              <Input
                value={customerData.cpfCnpj}
                onChange={(e) => onInputChange('cpfCnpj', e.target.value)}
                placeholder="000.000.000-00"
                className="glass-card border-neuro-border/50 focus:border-neuro-primary/60"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neuro-gray-700 mb-2">
                Telefone *
              </label>
              <Input
                value={customerData.phone}
                onChange={(e) => onInputChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                className="glass-card border-neuro-border/50 focus:border-neuro-primary/60"
              />
            </div>
          </div>

          {/* Address Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neuro-gray-700 mb-2">
                CEP *
              </label>
              <Input
                value={customerData.postalCode}
                onChange={(e) => onInputChange('postalCode', e.target.value)}
                placeholder="00000-000"
                className="glass-card border-neuro-border/50 focus:border-neuro-primary/60"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neuro-gray-700 mb-2">
                Endereço *
              </label>
              <Input
                value={customerData.address}
                onChange={(e) => onInputChange('address', e.target.value)}
                placeholder="Rua, Avenida, etc."
                className="glass-card border-neuro-border/50 focus:border-neuro-primary/60"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-semibold text-neuro-gray-700 mb-2">
                  Número *
                </label>
                <Input
                  value={customerData.addressNumber}
                  onChange={(e) => onInputChange('addressNumber', e.target.value)}
                  placeholder="123"
                  className="glass-card border-neuro-border/50 focus:border-neuro-primary/60"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-neuro-gray-700 mb-2">
                  Complemento
                </label>
                <Input
                  value={customerData.complement}
                  onChange={(e) => onInputChange('complement', e.target.value)}
                  placeholder="Apt, Sala, etc."
                  className="glass-card border-neuro-border/50 focus:border-neuro-primary/60"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neuro-gray-700 mb-2">
                  Cidade *
                </label>
                <Input
                  value={customerData.city}
                  onChange={(e) => onInputChange('city', e.target.value)}
                  placeholder="São Paulo"
                  className="glass-card border-neuro-border/50 focus:border-neuro-primary/60"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neuro-gray-700 mb-2">
                  Estado *
                </label>
                <Input
                  value={customerData.state}
                  onChange={(e) => onInputChange('state', e.target.value)}
                  placeholder="SP"
                  className="glass-card border-neuro-border/50 focus:border-neuro-primary/60"
                />
              </div>
            </div>
          </div>
        </div>

        <motion.div
          className="mt-6 p-4 glass-card rounded-xl border border-neuro-info/20 bg-neuro-info/5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-start space-x-3">
            <Icon name="shield" className="w-5 h-5 text-neuro-info mt-0.5" />
            <div>
              <Text size="sm" weight="semibold" color="default">
                Seus dados estão seguros
              </Text>
              <Text size="sm" color="muted">
                Utilizamos criptografia de ponta a ponta para proteger suas informações pessoais.
              </Text>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

// Payment Step Component  
export const PaymentStep: React.FC<{
  paymentMethod: 'CREDIT_CARD' | 'PIX';
  setPaymentMethod: (method: 'CREDIT_CARD' | 'PIX') => void;
  cardData: CardData;
  onCardInputChange: (field: keyof CardData, value: string) => void;
}> = ({ paymentMethod, setPaymentMethod, cardData, onCardInputChange }) => {
  return (
    <Card variant="glow" className="glass-card border border-neuro-border/30">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <motion.div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, #F59E0B 0%, #D97706 100%)`
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Icon name="creditCard" className="w-5 h-5" />
          </motion.div>
          <div>
            <h3 className="font-bold text-neuro-gray-900">Pagamento</h3>
            <p className="text-sm text-neuro-gray-600 font-normal">Escolha a forma de pagamento</p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { method: 'CREDIT_CARD', icon: 'creditCard', label: 'Cartão de Crédito', desc: 'Parcelado em até 12x' },
            { method: 'PIX', icon: 'zap', label: 'PIX', desc: 'Pagamento instantâneo' }
          ].map((option) => (
            <motion.button
              key={option.method}
              onClick={() => setPaymentMethod(option.method as any)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left",
                paymentMethod === option.method
                  ? "border-neuro-primary/50 bg-neuro-primary/5"
                  : "border-neuro-border/30 glass-card hover:border-neuro-border/50"
              )}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3 mb-2">
                <motion.div 
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg",
                    paymentMethod === option.method && "scale-110"
                  )}
                  style={{
                    background: paymentMethod === option.method
                      ? `linear-gradient(135deg, #2D5A1F 0%, #4A9A3F 100%)`
                      : `linear-gradient(135deg, #6B7280 0%, #4B5563 100%)`
                  }}
                >
                  <Icon name={option.icon as any} className="w-4 h-4" />
                </motion.div>
                <Text weight="semibold" color={paymentMethod === option.method ? 'primary' : 'default'}>
                  {option.label}
                </Text>
              </div>
              <Text size="sm" color="muted">
                {option.desc}
              </Text>
            </motion.button>
          ))}
        </div>

        {/* Credit Card Form */}
        {paymentMethod === 'CREDIT_CARD' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-semibold text-neuro-gray-700 mb-2">
                Nome no Cartão *
              </label>
              <Input
                value={cardData.holderName}
                onChange={(e) => onCardInputChange('holderName', e.target.value)}
                placeholder="Nome como está no cartão"
                className="glass-card border-neuro-border/50 focus:border-neuro-primary/60"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neuro-gray-700 mb-2">
                Número do Cartão *
              </label>
              <Input
                value={cardData.number}
                onChange={(e) => onCardInputChange('number', e.target.value)}
                placeholder="0000 0000 0000 0000"
                className="glass-card border-neuro-border/50 focus:border-neuro-primary/60"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neuro-gray-700 mb-2">
                  Mês *
                </label>
                <Input
                  value={cardData.expiryMonth}
                  onChange={(e) => onCardInputChange('expiryMonth', e.target.value)}
                  placeholder="MM"
                  className="glass-card border-neuro-border/50 focus:border-neuro-primary/60"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neuro-gray-700 mb-2">
                  Ano *
                </label>
                <Input
                  value={cardData.expiryYear}
                  onChange={(e) => onCardInputChange('expiryYear', e.target.value)}
                  placeholder="AAAA"
                  className="glass-card border-neuro-border/50 focus:border-neuro-primary/60"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neuro-gray-700 mb-2">
                  CVV *
                </label>
                <Input
                  value={cardData.ccv}
                  onChange={(e) => onCardInputChange('ccv', e.target.value)}
                  placeholder="000"
                  className="glass-card border-neuro-border/50 focus:border-neuro-primary/60"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* PIX Instructions */}
        {paymentMethod === 'PIX' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 glass-card rounded-xl border border-neuro-info/20 bg-neuro-info/5"
          >
            <div className="flex items-start space-x-4">
              <motion.div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, #10B981 0%, #059669 100%)`
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Icon name="zap" className="w-6 h-6" />
              </motion.div>
              <div>
                <Text weight="semibold" color="default" className="mb-2">
                  Pagamento via PIX
                </Text>
                <Text size="sm" color="muted" className="mb-4">
                  Após finalizar o pedido, você receberá um QR Code para pagamento instantâneo via PIX.
                </Text>
                <div className="space-y-2">
                  {[
                    'Pagamento processado em tempo real',
                    'Acesso imediato aos assistentes',
                    'Sem taxas adicionais'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Icon name="check" className="w-4 h-4 text-neuro-success" />
                      <Text size="sm" color="muted">{item}</Text>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </CardContent>
    </Card>
  );
};

// Confirmation Step Component
export const ConfirmationStep: React.FC<{
  processing: boolean;
  error: string | null;
}> = ({ processing, error }) => {
  if (processing) {
    return (
      <Card variant="glow" className="glass-card border border-neuro-border/30">
        <CardContent className="text-center py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center text-white shadow-glow-lg"
              style={{
                background: `linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)`
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
            >
              <Icon name="creditCard" className="w-8 h-8" />
            </motion.div>
            
            <Heading level="h3" color="primary" className="mb-4">
              Processando Pagamento
            </Heading>
            
            <Text size="lg" color="muted" className="mb-8">
              Aguarde enquanto processamos seu pagamento de forma segura...
            </Text>
            
            <LoadingSpinner size="lg" />
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="error" className="glass-card border border-neuro-error/30">
        <CardContent className="text-center py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, #EF4444 0%, #DC2626 100%)`
              }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Icon name="alertCircle" className="w-8 h-8" />
            </motion.div>
            
            <Heading level="h3" color="error" className="mb-4">
              Erro no Pagamento
            </Heading>
            
            <Text size="lg" color="muted" className="mb-8">
              {error}
            </Text>
            
            <Text size="sm" color="muted">
              Verifique os dados e tente novamente ou entre em contato com o suporte.
            </Text>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="success" className="glass-card border border-neuro-success/30">
      <CardContent className="text-center py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center text-white shadow-glow-lg"
            style={{
              background: `linear-gradient(135deg, #10B981 0%, #059669 100%)`
            }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", duration: 0.8 }}
          >
            <Icon name="check" className="w-8 h-8" />
          </motion.div>
          
          <Heading level="h3" color="success" className="mb-4">
            🎉 Pagamento Realizado com Sucesso!
          </Heading>
          
          <Text size="lg" color="muted" className="mb-8">
            Sua assinatura foi ativada e você já pode começar a usar seus assistentes especializados.
          </Text>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: 'message', text: 'Chat disponível', desc: 'Comece agora' },
              { icon: 'mail', text: 'Email enviado', desc: 'Confirmaçãoe detalhes' },
              { icon: 'headphones', text: 'Suporte ativo', desc: 'Ajuda 24/7' }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="glass-card p-4 rounded-xl border border-neuro-success/20 bg-neuro-success/5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex flex-col items-center text-center">
                  <Icon name={item.icon as any} className="w-6 h-6 text-neuro-success mb-2" />
                  <Text size="sm" weight="semibold" color="default">
                    {item.text}
                  </Text>
                  <Text size="xs" color="muted">
                    {item.desc}
                  </Text>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

// Order Summary Component
export const OrderSummary: React.FC<{
  checkoutData: CheckoutData;
  assistants: Assistant[];
  getCurrentAssistant: () => Assistant | null;
  getSelectedAssistants: () => Assistant[];
  formatCurrency: (value: number) => string;
}> = ({ checkoutData, assistants, getCurrentAssistant, getSelectedAssistants, formatCurrency }) => {
  const currentAssistant = getCurrentAssistant();
  const selectedAssistants = getSelectedAssistants();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="sticky top-6"
    >
      <Card variant="glow" className="glass-card border border-neuro-border/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icon name="receipt" className="w-5 h-5 text-neuro-primary" />
            <span>Resumo do Pedido</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Order Items */}
          <div className="space-y-3">
            {checkoutData.type === 'individual' && currentAssistant ? (
              <div className="glass-card p-3 rounded-lg border border-neuro-border/20">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${currentAssistant.color_theme} 0%, ${currentAssistant.color_theme}CC 100%)`
                    }}
                  >
                    <Icon name="brain" className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <Text size="sm" weight="semibold" color="default">
                      {currentAssistant.name}
                    </Text>
                    <Text size="xs" color="muted">
                      {checkoutData.subscription_type === 'monthly' ? 'Mensal' : 'Semestral'}
                    </Text>
                  </div>
                </div>
              </div>
            ) : checkoutData.type === 'package' && selectedAssistants.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Text size="sm" weight="semibold" color="default">
                    {checkoutData.package_type === 'package_6' ? 'Pacote 6' : 'Pacote 3'} Assistentes
                  </Text>
                  <div className="inline-flex items-center px-2 py-1 bg-neuro-success/10 text-neuro-success rounded-full text-xs font-semibold">
                    {checkoutData.package_type === 'package_6' ? '25% OFF' : '17% OFF'}
                  </div>
                </div>
                
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {selectedAssistants.map((assistant) => (
                    <div key={assistant.id} className="flex items-center space-x-2 py-1">
                      <div 
                        className="w-4 h-4 rounded flex items-center justify-center"
                        style={{ backgroundColor: `${assistant.color_theme}40` }}
                      >
                        <div className="w-2 h-2 rounded-full bg-current" style={{ color: assistant.color_theme }} />
                      </div>
                      <Text size="xs" color="muted">
                        {assistant.name}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Divider */}
          <div className="border-t border-neuro-border/30" />

          {/* Total */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Text color="muted">
                Subtotal:
              </Text>
              <Text weight="semibold" color="default">
                {formatCurrency(checkoutData.total_price)}
              </Text>
            </div>

            <div className="flex items-center justify-between">
              <Text color="muted">
                Impostos:
              </Text>
              <Text color="muted">
                Inclusos
              </Text>
            </div>

            <div className="border-t border-neuro-border/30 pt-2">
              <div className="flex items-center justify-between">
                <Text size="lg" weight="bold" color="default">
                  Total:
                </Text>
                <motion.div
                  className="text-right"
                  whileHover={{ scale: 1.05 }}
                >
                  <Text size="xl" weight="bold" color="primary">
                    {formatCurrency(checkoutData.total_price)}
                  </Text>
                  <Text size="sm" color="muted">
                    /{checkoutData.subscription_type === 'monthly' ? 'mês' : 'semestre'}
                  </Text>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <motion.div
            className="glass-card p-3 rounded-lg border border-neuro-success/20 bg-neuro-success/5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center space-x-2">
              <Icon name="shield" className="w-4 h-4 text-neuro-success" />
              <Text size="xs" color="muted">
                Pagamento 100% seguro e criptografado
              </Text>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};