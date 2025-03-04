/*
  # Create auth triggers for user profiles

  1. New Triggers
    - Create triggers to automatically create user profiles in the appropriate tables
    - Handle Google OAuth sign-ups by creating profiles based on user metadata
  
  2. Security
    - Ensure user data is properly associated with auth.users
*/

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type TEXT;
BEGIN
  -- Get the user type from metadata if available
  user_type := NEW.raw_user_meta_data->>'user_type';
  
  -- If user_type is not set (e.g., from OAuth), default to 'customer'
  IF user_type IS NULL THEN
    user_type := 'customer';
  END IF;
  
  -- For Google OAuth users, extract name from identity data
  IF NEW.raw_user_meta_data->>'provider' = 'google' THEN
    IF user_type = 'builder' THEN
      INSERT INTO public.builders (
        id, 
        full_name, 
        email, 
        phone,
        email_verified
      ) VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_app_meta_data->>'name', NEW.raw_app_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
        NEW.email, 
        COALESCE(NEW.phone, ''),
        TRUE
      );
    ELSE
      INSERT INTO public.customers (
        id, 
        full_name, 
        email, 
        phone,
        email_verified
      ) VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_app_meta_data->>'name', NEW.raw_app_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
        NEW.email, 
        COALESCE(NEW.phone, ''),
        TRUE
      );
    END IF;
  -- For email/password users, use the metadata provided during signup
  ELSIF NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
    IF user_type = 'builder' THEN
      INSERT INTO public.builders (
        id, 
        full_name, 
        email, 
        phone, 
        business_name,
        email_verified
      ) VALUES (
        NEW.id, 
        NEW.raw_user_meta_data->>'full_name', 
        NEW.email, 
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
        NEW.raw_user_meta_data->>'business_name',
        COALESCE((NEW.email_confirmed_at IS NOT NULL), FALSE)
      );
    ELSE
      INSERT INTO public.customers (
        id, 
        full_name, 
        email, 
        phone, 
        preferred_location,
        email_verified
      ) VALUES (
        NEW.id, 
        NEW.raw_user_meta_data->>'full_name', 
        NEW.email, 
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
        NEW.raw_user_meta_data->>'preferred_location',
        COALESCE((NEW.email_confirmed_at IS NOT NULL), FALSE)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signups
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email verification status in builder profile
  IF EXISTS (SELECT 1 FROM public.builders WHERE id = NEW.id) THEN
    UPDATE public.builders
    SET 
      email = NEW.email,
      email_verified = COALESCE((NEW.email_confirmed_at IS NOT NULL), FALSE),
      updated_at = now()
    WHERE id = NEW.id;
  END IF;
  
  -- Update email verification status in customer profile
  IF EXISTS (SELECT 1 FROM public.customers WHERE id = NEW.id) THEN
    UPDATE public.customers
    SET 
      email = NEW.email,
      email_verified = COALESCE((NEW.email_confirmed_at IS NOT NULL), FALSE),
      updated_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user updates
CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();