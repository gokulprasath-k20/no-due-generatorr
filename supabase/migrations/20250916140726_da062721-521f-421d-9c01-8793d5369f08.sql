-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  register_number TEXT NOT NULL UNIQUE,
  year INTEGER NOT NULL CHECK (year IN (2, 3)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marks table  
CREATE TABLE public.marks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  iat1 INTEGER,
  iat2 INTEGER,
  model INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject)
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;

-- Create policies for students table (public read access)
CREATE POLICY "Students are publicly readable" 
ON public.students 
FOR SELECT 
USING (true);

CREATE POLICY "Students can be inserted" 
ON public.students 
FOR INSERT 
WITH CHECK (true);

-- Create policies for marks table (public read access)
CREATE POLICY "Marks are publicly readable" 
ON public.marks 
FOR SELECT 
USING (true);

CREATE POLICY "Marks can be inserted/updated" 
ON public.marks 
FOR ALL 
USING (true);

-- Add indexes for better performance
CREATE INDEX idx_students_register_number ON public.students(register_number);
CREATE INDEX idx_marks_student_id ON public.marks(student_id);