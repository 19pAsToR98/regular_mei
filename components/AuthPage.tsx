import React, { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthPageProps {
  onLogin: (user: User) => void;
  onForgotPassword: (email: string) => Promise<boolean>; // Keeping signature for compatibility, but logic moves to Auth UI
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  // The Auth UI handles all login/register/forgot password logic internally.
  // We only need to listen for the session change in App.tsx or a wrapper.

  // Custom styling to match the application's aesthetic
  const customTheme = {
    default: {
      colors: {
        brand: 'hsl(217 78% 51%)', // Primary Blue
        brandAccent: 'hsl(217 78% 41%)',
        defaultButtonBackground: 'hsl(210 40% 96%)', // Slate-100
        defaultButtonBackgroundHover: 'hsl(210 40% 90%)',
        defaultButtonBorder: 'hsl(210 40% 90%)',
        inputBackground: 'hsl(0 0% 100%)',
        inputBorder: 'hsl(214.3 31.8% 91.4%)',
        inputBorderHover: 'hsl(214.3 31.8% 81.4%)',
        inputBorderFocus: 'hsl(217 78% 51%)',
        inputLabelText: 'hsl(215.4 16.3% 46.9%)',
        inputText: 'hsl(222.2 47.4% 11.2%)',
      },
      space: {
        spaceSmall: '10px',
        spaceMedium: '15px',
        spaceLarge: '20px',
      },
      radii: {
        borderRadiusButton: '8px',
        inputBorderRadius: '8px',
      },
    },
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Left Side - Image/Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800 opacity-90 z-10"></div>
        <img 
            src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1500" 
            alt="Office" 
            className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 text-white p-12 text-center">
            <img 
                src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
                alt="Regular MEI" 
                className="h-16 mx-auto mb-8 object-contain brightness-0 invert"
            />
            <h2 className="text-3xl font-bold mb-4">Simplifique sua vida de MEI</h2>
            <p className="text-blue-100 text-lg max-w-md mx-auto">
                Gestão financeira, fiscal e benefícios em um único lugar. Feito para você crescer.
            </p>
        </div>
        {/* Decorative Circles */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full z-10"></div>
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white opacity-10 rounded-full z-10"></div>
      </div>

      {/* Right Side - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="max-w-md w-full">
            
            <div className="text-center mb-8 lg:hidden">
                <img 
                    src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
                    alt="Regular MEI" 
                    className="h-10 mx-auto"
                />
            </div>

            <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa, variables: customTheme }}
                theme="light"
                providers={[]}
                redirectTo={window.location.origin}
                localization={{
                    variables: {
                        sign_in: {
                            email_label: 'Email',
                            password_label: 'Senha',
                            email_input_placeholder: 'seu@email.com',
                            password_input_placeholder: '••••••••',
                            button_label: 'Entrar',
                            loading_button_label: 'Entrando...',
                            link_text: 'Já tem uma conta? Faça login',
                            social_provider_text: 'Entrar com {{provider}}',
                            forgotten_password: 'Esqueceu a senha?',
                            sign_in_action_label: 'Acesse sua conta',
                            sign_in_action_button_label: 'Entrar',
                        },
                        sign_up: {
                            email_label: 'Email',
                            password_label: 'Crie uma senha',
                            email_input_placeholder: 'seu@email.com',
                            password_input_placeholder: '••••••••',
                            button_label: 'Cadastrar',
                            loading_button_label: 'Cadastrando...',
                            link_text: 'Não tem uma conta? Cadastre-se',
                            sign_up_action_label: 'Crie sua conta grátis',
                            sign_up_action_button_label: 'Cadastrar',
                        },
                        forgotten_password: {
                            email_label: 'Email Cadastrado',
                            email_input_placeholder: 'seu@email.com',
                            button_label: 'Recuperar Senha',
                            loading_button_label: 'Enviando...',
                            link_text: 'Esqueceu a senha?',
                            forgotten_password_action_label: 'Recuperar Senha',
                        },
                        update_password: {
                            password_label: 'Nova Senha',
                            password_input_placeholder: '••••••••',
                            button_label: 'Atualizar Senha',
                            loading_button_label: 'Atualizando...',
                        }
                    }
                }}
            />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;