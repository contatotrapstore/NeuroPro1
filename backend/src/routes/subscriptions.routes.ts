import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { SubscriptionsController } from '../controllers/subscriptions.controller';

const router = Router();

// Obter assinaturas do usuário
router.get('/', authenticateToken, SubscriptionsController.getUserSubscriptions);

// Obter pacotes do usuário
router.get('/packages', authenticateToken, SubscriptionsController.getUserPackages);

// Criar assinatura individual
router.post('/individual', authenticateToken, SubscriptionsController.createIndividualSubscription);

// Criar pacote customizado
router.post('/package', authenticateToken, SubscriptionsController.createPackageSubscription);

// Cancelar assinatura
router.delete('/:subscriptionId', authenticateToken, SubscriptionsController.cancelSubscription);

// Cancelar pacote
router.delete('/packages/:packageId', authenticateToken, SubscriptionsController.cancelPackage);

export default router;