
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Users, MessageCircle, Gamepad2, Shield, CheckCircle } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, authError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
    class: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if user is already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      class: value
    }));
  };

  const classOptions = [
    '1A LAT', '1A WET', '1B LAT', '1B WET', '1C', '1D', '1E', '1F', '1G', '1H', '1I',
    '2A LAT', '2B E&O', '2C E&O', '2D STWE', '2E STWE', '2F STWE', '2G MTWE', '2H MTWE',
    '3BW', '3EWmt 1', '3EWmt 2', '3EWww', '3HW', '3LAww', '3MTec', '3MTww', '3NWww1', '3NWww2', '3TW',
    '4BW', '4EWww', '4HW', '4LAmt', '4LAww', '4MTec', '4MTww', '4NWmt', '4NWww', '4TW'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsSubmitting(false);
      return;
    }

    if (!formData.username.trim()) {
      setError('Username is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.displayName.trim()) {
      setError('Display name is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.class.trim()) {
      setError('Klas is verplicht');
      setIsSubmitting(false);
      return;
    }

    const userData = {
      username: formData.username.trim(),
      display_name: formData.displayName.trim(),
      class: formData.class.trim()
    };

    const result = await register(formData.email, formData.password, userData);
    
    if (result.error) {
      setError(result.error.message || 'Registration failed');
    } else {
      // Show success message and redirect to login
      navigate('/login', { 
        replace: true,
        state: { message: 'Account created successfully! Please sign in.' }
      });
    }
    
    setIsSubmitting(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Don't render if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - Branding & Info (Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-purple-600 to-pink-500 p-12 flex-col justify-center text-white">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold mb-4">Campus Fenix</h1>
            <p className="text-xl opacity-90 mb-8">
              Word lid van duizenden studenten die al verbonden zijn via Campus Fenix
            </p>
            
            <div className="space-y-4">
              {[
                { icon: Users, text: 'Verbind met klasgenoten' },
                { icon: MessageCircle, text: 'Chat in real-time met vrienden' },
                { icon: Gamepad2, text: 'Speel games tussen de lessen door' },
                { icon: Shield, text: 'Veilig en privé platform' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className="flex items-center gap-3 text-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <item.icon className="h-5 w-5" />
                  </div>
                  {item.text}
                </motion.div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-white/20 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>100% gratis om te gebruiken</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>Geen advertenties in je berichten</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>Je gegevens worden nooit verkocht</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right side - Signup Form */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8 lg:hidden"
            >
              <h1 className="text-4xl font-bold text-primary">Campus Fenix</h1>
              <p className="text-muted-foreground mt-2">Word lid van je klas gemeenschap</p>
            </motion.div>
      
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
        <Card className="border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Account Aanmaken</CardTitle>
            <CardDescription className="text-center">
              Registreer om te beginnen met Campus Fenix
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(error || authError) && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error || authError}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Gebruikersnaam</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Gebruikersnaam"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName">Weergavenaam</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    placeholder="Jouw Naam"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Voer je email in"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="class">Klas</Label>
                <Select value={formData.class} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer je klas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((classOption) => (
                      <SelectItem key={classOption} value={classOption}>
                        {classOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Wachtwoord</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Maak een wachtwoord"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Bevestig Wachtwoord</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Bevestig je wachtwoord"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Account Aanmaken..." : "Account Aanmaken"}
              </Button>
            </form>
            
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Heb je al een account? </span>
              <Link to="/login" className="text-primary hover:underline">
                Inloggen
              </Link>
            </div>
          </CardContent>
        </Card>
            </motion.div>
            
            {/* Mobile info section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 text-center text-sm text-muted-foreground lg:hidden"
            >
              <p className="mb-4">
                Sluit je aan bij duizenden studenten die Campus Fenix gebruiken om te connecten, delen en leren.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <span>✓ Gratis</span>
                <span>✓ Veilig</span>
                <span>✓ Voor studenten</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom info section for SEO */}
      <div className="bg-muted/50 border-t py-8 px-4">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <h2 className="font-semibold text-foreground mb-2">Waarom Campus Fenix?</h2>
          <p className="mb-4">
            Campus Fenix is speciaal ontworpen voor studenten die willen connecten met hun schoolgemeenschap.
            Of je nu studiegroepen zoekt, campus momenten wilt delen, of verbonden wilt blijven met klasgenoten,
            ons platform biedt alle tools die je nodig hebt. Met functies zoals real-time berichten, leuke games,
            slimme notificaties, en een privacy-first design, is Campus Fenix de perfecte metgezel voor je studiereis.
          </p>
          <p>
            © {new Date().getFullYear()} Campus Fenix. Alle rechten voorbehouden. Gemaakt met ❤️ voor studenten.
          </p>
        </div>
      </div>
    </main>
  );
};

export default Signup;
