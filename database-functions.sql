-- Update or create a function to update marks with proper column names
CREATE OR REPLACE FUNCTION update_student_marks(
  p_student_id UUID,
  p_subject TEXT,
  p_iat1 INTEGER DEFAULT NULL,
  p_iat2 INTEGER DEFAULT NULL,
  p_model INTEGER DEFAULT NULL,
  p_signed BOOLEAN DEFAULT FALSE,
  p_assignment_submitted BOOLEAN DEFAULT FALSE,
  p_department_fine INTEGER DEFAULT 0
) 
RETURNS VOID AS $$
BEGIN
  -- First try to update existing record
  UPDATE marks
  SET 
    iat1 = COALESCE(p_iat1, iat1),
    iat2 = COALESCE(p_iat2, iat2),
    model = COALESCE(p_model, model),
    signed = COALESCE(p_signed, signed),
    "assignmentSubmitted" = COALESCE(p_assignment_submitted, "assignmentSubmitted"),
    department_fine = COALESCE(p_department_fine, department_fine),
    updated_at = NOW()
  WHERE student_id = p_student_id AND subject = p_subject;
  
  -- If no rows were updated, insert a new record
  IF NOT FOUND THEN
    INSERT INTO marks (
      student_id, 
      subject, 
      iat1, 
      iat2, 
      model, 
      signed, 
      "assignmentSubmitted", 
      department_fine
    )
    VALUES (
      p_student_id, 
      p_subject, 
      p_iat1, 
      p_iat2, 
      p_model, 
      p_signed, 
      p_assignment_submitted, 
      p_department_fine
    )
    ON CONFLICT (student_id, subject) 
    DO UPDATE SET 
      iat1 = EXCLUDED.iat1,
      iat2 = EXCLUDED.iat2,
      model = EXCLUDED.model,
      signed = EXCLUDED.signed,
      "assignmentSubmitted" = EXCLUDED."assignmentSubmitted",
      department_fine = EXCLUDED.department_fine,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
