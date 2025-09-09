import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomDomain extends Document {
  userId: mongoose.Types.ObjectId;
  domain: string;
  subdomain?: string; // Para casos como links.example.com
  fullDomain: string; // El dominio completo (subdomain + domain o solo domain)
  isVerified: boolean;
  isActive: boolean;
  isBlocked: boolean; // Si el dominio está bloqueado por administradores
  blockedReason?: string; // Razón del bloqueo
  verificationToken: string;
  dnsRecords: {
    type: 'CNAME' | 'A';
    name: string;
    value: string;
    ttl?: number;
  }[];
  vercelDomainId?: string; // ID del dominio en Vercel
  vercelConfigurationId?: string; // ID de configuración en Vercel
  sslStatus: 'pending' | 'active' | 'error';
  sslError?: string;
  lastVerificationCheck: Date;
  verificationAttempts: number;
  maxVerificationAttempts: number;
  isDefault: boolean; // Si es el dominio por defecto del usuario
  createdAt: Date;
  updatedAt: Date;
}

const CustomDomainSchema = new Schema<ICustomDomain>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (domain: string) {
          // Validar formato de dominio
          const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
          return domainRegex.test(domain);
        },
        message: 'Invalid domain format',
      },
    },
    subdomain: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (subdomain: string) {
          if (!subdomain) return true;
          // Validar formato de subdominio
          const subdomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/;
          return subdomainRegex.test(subdomain);
        },
        message: 'Invalid subdomain format',
      },
    },
    fullDomain: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedReason: {
      type: String,
      trim: true,
    },
    verificationToken: {
      type: String,
      required: true,
      unique: true,
    },
    dnsRecords: {
      type: [
        {
          type: {
            type: String,
            enum: ['CNAME', 'A'],
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
          value: {
            type: String,
            required: true,
          },
          ttl: {
            type: Number,
            default: 3600,
          },
        },
      ],
      default: [],
    },
    vercelDomainId: {
      type: String,
      trim: true,
    },
    vercelConfigurationId: {
      type: String,
      trim: true,
    },
    sslStatus: {
      type: String,
      enum: ['pending', 'active', 'error'],
      default: 'pending',
    },
    sslError: {
      type: String,
      trim: true,
    },
    lastVerificationCheck: {
      type: Date,
      default: Date.now,
    },
    verificationAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxVerificationAttempts: {
      type: Number,
      default: 10,
      min: 1,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para optimizar consultas
CustomDomainSchema.index({ userId: 1 });
CustomDomainSchema.index({ fullDomain: 1 }, { unique: true });
CustomDomainSchema.index({ userId: 1, isDefault: 1 });
CustomDomainSchema.index({ isVerified: 1, isActive: 1 });
CustomDomainSchema.index({ verificationToken: 1 }, { unique: true });
CustomDomainSchema.index({ vercelDomainId: 1 }, { sparse: true });

// Middleware para generar fullDomain antes de guardar
CustomDomainSchema.pre('save', function (next) {
  if (this.subdomain) {
    this.fullDomain = `${this.subdomain}.${this.domain}`;
  } else {
    this.fullDomain = this.domain;
  }
  next();
});

// Middleware para asegurar que solo hay un dominio por defecto por usuario
CustomDomainSchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Desactivar otros dominios por defecto del mismo usuario
    await mongoose.model('CustomDomain').updateMany(
      { 
        userId: this.userId, 
        _id: { $ne: this._id },
        isDefault: true 
      },
      { isDefault: false }
    );
  }
  next();
});

// Método estático para obtener el dominio por defecto de un usuario
CustomDomainSchema.statics.getDefaultDomain = function(userId: mongoose.Types.ObjectId) {
  return this.findOne({ 
    userId, 
    isDefault: true, 
    isVerified: true, 
    isActive: true 
  });
};

// Método para verificar si el dominio está listo para usar
CustomDomainSchema.methods.isReadyToUse = function() {
  return this.isVerified && this.isActive && this.sslStatus === 'active';
};

const CustomDomain = mongoose.models.CustomDomain || 
  mongoose.model<ICustomDomain>('CustomDomain', CustomDomainSchema);

export default CustomDomain;
export { CustomDomain };