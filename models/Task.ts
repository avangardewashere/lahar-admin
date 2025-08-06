import mongoose, { Schema, Document } from 'mongoose';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  tags: string[];
  dueDate?: Date;
  startDate?: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }>;
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    createdAt: Date;
  }>;
  userId: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot be more than 2000 characters'],
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed', 'cancelled'],
      default: 'todo',
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      required: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, 'Category cannot be more than 50 characters'],
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [30, 'Tag cannot be more than 30 characters'],
    }],
    dueDate: {
      type: Date,
    },
    startDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    estimatedHours: {
      type: Number,
      min: [0, 'Estimated hours cannot be negative'],
      max: [1000, 'Estimated hours cannot exceed 1000'],
    },
    actualHours: {
      type: Number,
      min: [0, 'Actual hours cannot be negative'],
      max: [1000, 'Actual hours cannot exceed 1000'],
    },
    attachments: [{
      name: {
        type: String,
        required: true,
        trim: true,
      },
      url: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    subtasks: [{
      id: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: [150, 'Subtask title cannot be more than 150 characters'],
      },
      completed: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true, // Add index for performance
    },
    assignedTo: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user ID is required'],
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true, // Add index for filtering
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, priority: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, createdAt: -1 });
TaskSchema.index({ tags: 1 });
TaskSchema.index({ category: 1 });

// Middleware to set completedAt when status changes to completed
TaskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed' && this.completedAt) {
      this.completedAt = undefined;
    }
  }
  
  // Set createdBy to userId if not already set (for backward compatibility)
  if (!this.createdBy && this.userId) {
    this.createdBy = this.userId;
  }
  
  next();
});

// Virtual for task progress (based on subtasks)
TaskSchema.virtual('progress').get(function(this: ITask) {
  if (!this.subtasks || this.subtasks.length === 0) {
    return this.status === 'completed' ? 100 : 0;
  }
  
  const completedSubtasks = this.subtasks.filter(subtask => subtask.completed).length;
  return Math.round((completedSubtasks / this.subtasks.length) * 100);
});

// Virtual for overdue status
TaskSchema.virtual('isOverdue').get(function(this: ITask) {
  if (!this.dueDate || this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > this.dueDate;
});

// Virtual for days until due
TaskSchema.virtual('daysUntilDue').get(function(this: ITask) {
  if (!this.dueDate) return null;
  
  const now = new Date();
  const diffTime = this.dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);