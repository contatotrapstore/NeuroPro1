import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '../../utils/cn';

// Floating Particles Background
export interface ParticlesProps {
  className?: string;
  count?: number;
  color?: string;
}

export const FloatingParticles: React.FC<ParticlesProps> = ({ 
  className,
  count = 50,
  color = '#2D5A1F'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        speed: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1
      }));
      setParticles(newParticles);
    };

    generateParticles();
  }, [count]);

  return (
    <div 
      ref={containerRef}
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, ${color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
          }}
          initial={{
            x: `${particle.x}%`,
            y: `${particle.y}%`,
          }}
          animate={{
            y: [`${particle.y}%`, `${particle.y - 20}%`, `${particle.y}%`],
            opacity: [particle.opacity, particle.opacity * 0.3, particle.opacity],
          }}
          transition={{
            duration: particle.speed * 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Animated Grid Background
export interface AnimatedGridProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const AnimatedGrid: React.FC<AnimatedGridProps> = ({
  className,
  size = 40,
  strokeWidth = 1,
  color = '#2D5A1F20'
}) => {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="animated-grid"
            width={size}
            height={size}
            patternUnits="userSpaceOnUse"
          >
            <motion.path
              d={`M ${size} 0 L 0 0 0 ${size}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#animated-grid)" />
      </svg>
    </div>
  );
};

// Morphing Blob Effect
export interface MorphingBlobProps {
  className?: string;
  size?: number;
  color?: string;
  speed?: number;
}

export const MorphingBlob: React.FC<MorphingBlobProps> = ({
  className,
  size = 200,
  color = '#2D5A1F',
  speed = 8
}) => {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!pathRef.current) return;

    const morphPaths = [
      "M40,80 C70,20 130,20 160,80 C150,140 90,140 40,80 Z",
      "M60,60 C100,40 140,80 120,120 C80,140 40,100 60,60 Z",
      "M80,40 C120,60 160,100 140,140 C100,160 60,120 80,40 Z",
      "M40,80 C70,20 130,20 160,80 C150,140 90,140 40,80 Z"
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (pathRef.current) {
        pathRef.current.setAttribute('d', morphPaths[currentIndex]);
        currentIndex = (currentIndex + 1) % morphPaths.length;
      }
    }, speed * 1000);

    return () => clearInterval(interval);
  }, [speed]);

  return (
    <div className={cn("absolute pointer-events-none", className)}>
      <svg width={size} height={size} viewBox="0 0 200 200" className="opacity-10">
        <defs>
          <linearGradient id="blobGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.2 }} />
          </linearGradient>
        </defs>
        <motion.path
          ref={pathRef}
          d="M40,80 C70,20 130,20 160,80 C150,140 90,140 40,80 Z"
          fill="url(#blobGradient)"
          animate={{
            scale: [1, 1.1, 0.9, 1],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{
            duration: speed * 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </svg>
    </div>
  );
};

// Gradient Orb Effect
export interface GradientOrbProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  animated?: boolean;
}

export const GradientOrb: React.FC<GradientOrbProps> = ({
  className,
  size = 'md',
  color = '#2D5A1F',
  animated = true
}) => {
  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-48 h-48", 
    lg: "w-64 h-64",
    xl: "w-96 h-96"
  };

  const orb = (
    <div
      className={cn(
        "rounded-full blur-3xl opacity-30",
        sizeClasses[size],
        className
      )}
      style={{
        background: `radial-gradient(circle, ${color}80 0%, ${color}20 40%, transparent 70%)`
      }}
    />
  );

  if (animated) {
    return (
      <motion.div
        animate={{
          scale: [1, 1.2, 0.8, 1],
          opacity: [0.3, 0.6, 0.2, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {orb}
      </motion.div>
    );
  }

  return orb;
};

// Ripple Effect
export interface RippleEffectProps {
  className?: string;
  trigger?: boolean;
  color?: string;
  size?: number;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({
  className,
  trigger = false,
  color = '#2D5A1F',
  size = 300
}) => {
  return (
    <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none", className)}>
      <motion.div
        className="rounded-full border-2 opacity-0"
        style={{
          borderColor: `${color}50`,
          width: size,
          height: size
        }}
        animate={trigger ? {
          scale: [0, 1.5],
          opacity: [0.8, 0],
        } : {}}
        transition={{
          duration: 1.5,
          ease: "easeOut"
        }}
      />
    </div>
  );
};

// Parallax Container
export interface ParallaxContainerProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const ParallaxContainer: React.FC<ParallaxContainerProps> = ({
  children,
  className,
  speed = 0.5,
  direction = 'up'
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [elementTop, setElementTop] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const onScroll = () => {
      const rect = element.getBoundingClientRect();
      setElementTop(rect.top);
      setClientHeight(window.innerHeight);
    };

    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const y = useMotionValue(0);
  const transforms = {
    up: useTransform(y, [0, clientHeight], [0, -50 * speed]),
    down: useTransform(y, [0, clientHeight], [0, 50 * speed]),
    left: useTransform(y, [0, clientHeight], [0, -50 * speed]),
    right: useTransform(y, [0, clientHeight], [0, 50 * speed])
  };

  useEffect(() => {
    const scrollProgress = Math.max(0, (clientHeight - elementTop) / (clientHeight + 100));
    y.set(scrollProgress * clientHeight);
  }, [elementTop, clientHeight, y]);

  const transform = direction === 'left' || direction === 'right' 
    ? { x: transforms[direction] }
    : { y: transforms[direction] };

  return (
    <div ref={ref} className={className}>
      <motion.div style={transform}>
        {children}
      </motion.div>
    </div>
  );
};

// Mouse Trail Effect
export const MouseTrail: React.FC = () => {
  const [trails, setTrails] = useState<Array<{ x: number; y: number; id: number }>>([]);

  useEffect(() => {
    let id = 0;
    const handleMouseMove = (e: MouseEvent) => {
      setTrails(prev => [
        ...prev.slice(-10), // Keep only last 10 trails
        { x: e.clientX, y: e.clientY, id: id++ }
      ]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {trails.map((trail, index) => (
        <motion.div
          key={trail.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: trail.x - 4,
            top: trail.y - 4,
            background: `radial-gradient(circle, #2D5A1F${Math.floor((index / trails.length) * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      ))}
    </div>
  );
};

// Text Reveal Animation
export interface TextRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const TextReveal: React.FC<TextRevealProps> = ({
  children,
  className,
  delay = 0
}) => {
  // If children contains React elements, render directly with animation
  if (typeof children !== 'string') {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: delay,
          ease: "easeOut"
        }}
      >
        {children}
      </motion.div>
    );
  }

  // For string children, split into words for word-by-word animation
  const words = children.split(' ');

  return (
    <div className={className}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="inline-block mr-2"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + index * 0.1,
            ease: "easeOut"
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};