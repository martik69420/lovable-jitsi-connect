import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/component/ui/card';
import { Button } from '@/component/ui/button';
import { 
  Users, MessageCircle, Gamepad2, Bell, Shield, 
  Heart, Share2, BookOpen, Trophy, Sparkles,
  Globe, Zap, Star, TrendingUp
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Connect with Classmates',
    description: 'Find and connect with students from your school. Build lasting friendships and expand your network within your campus community.'
  },
  {
    icon: MessageCircle,
    title: 'Real-time Messaging',
    description: 'Chat instantly with friends through our secure messaging system. Share photos, GIFs, voice messages and more.'
  },
  {
    icon: Gamepad2,
    title: 'Fun Games',
    description: 'Take a break and enjoy classic games like Snake, Tetris, Pong, and more. Challenge your friends and compete for high scores.'
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Stay updated with personalized notifications for messages, friend requests, post interactions, and more.'
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'Your privacy matters. We use advanced security measures to keep your data safe and give you control over your information.'
  },
  {
    icon: Heart,
    title: 'Engage with Posts',
    description: 'Like, comment, and share posts from your community. Express yourself and interact with content that matters to you.'
  }
];

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '50K+', label: 'Posts Shared' },
  { value: '100K+', label: 'Messages Sent' },
  { value: '5+', label: 'Fun Games' }
];

const testimonials = [
  {
    name: 'Emma S.',
    role: 'University Student',
    text: 'Campus Fenix has completely changed how I connect with my classmates. The messaging is so smooth and the games are a great way to relax between classes!',
    avatar: '👩‍🎓'
  },
  {
    name: 'Michael T.',
    role: 'High School Senior',
    text: 'I love being able to share what\'s happening on campus and see what my friends are up to. The notifications keep me in the loop without being overwhelming.',
    avatar: '👨‍🎓'
  },
  {
    name: 'Sarah L.',
    role: 'College Freshman',
    text: 'Making new friends in college was intimidating, but Campus Fenix made it easy to find people with similar interests. Best platform for students!',
    avatar: '👩‍💻'
  }
];

const PublicLanding: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-12 px-4"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Welcome to Campus Fenix
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            The ultimate social platform for students. Connect, share, and grow with your campus community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/signup">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
          >
            <Card className="text-center p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </motion.section>

      {/* Features Section */}
      <section className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold mb-2">Everything You Need</h2>
          <p className="text-muted-foreground">Discover all the features that make Campus Fenix special</p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-primary/10">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-8 bg-muted/30 rounded-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold mb-2">How It Works</h2>
          <p className="text-muted-foreground">Get started in just 3 simple steps</p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: '1', icon: Sparkles, title: 'Create Your Account', desc: 'Sign up with your email and set up your profile in seconds' },
            { step: '2', icon: Users, title: 'Find Your Friends', desc: 'Connect with classmates and discover new people on campus' },
            { step: '3', icon: Share2, title: 'Start Sharing', desc: 'Post updates, share moments, and engage with your community' }
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 * index }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                {item.step}
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold mb-2">What Students Say</h2>
          <p className="text-muted-foreground">Join thousands of happy students already on Campus Fenix</p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 * index }}
            >
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{testimonial.avatar}</div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                  <div className="flex gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold mb-2">Why Choose Campus Fenix?</h2>
          <p className="text-muted-foreground">We're built specifically for the student experience</p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            { icon: Globe, title: 'Built for Students', desc: 'Designed with student needs in mind - from study groups to social events' },
            { icon: Zap, title: 'Lightning Fast', desc: 'Optimized performance so you never miss a moment' },
            { icon: Shield, title: 'Privacy First', desc: 'Your data is yours. We never sell your information to third parties' },
            { icon: TrendingUp, title: 'Always Improving', desc: 'Regular updates with new features based on student feedback' }
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="flex gap-4 items-start p-4 rounded-lg bg-muted/50"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="text-center py-12 px-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-xl"
      >
        <h2 className="text-3xl font-bold mb-4">Ready to Join Your Campus Community?</h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Create your free account today and start connecting with students from your school. It only takes a minute!
        </p>
        <Button asChild size="lg" className="text-lg px-8">
          <Link to="/signup">Join Campus Fenix</Link>
        </Button>
      </motion.section>

      {/* Footer Info for SEO */}
      <section className="px-4 py-8 border-t">
        <div className="grid md:grid-cols-3 gap-8 text-sm text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground mb-3">About Campus Fenix</h3>
            <p>
              Campus Fenix is a social platform designed exclusively for students. Our mission is to help students 
              connect, collaborate, and build meaningful relationships within their campus community. Whether you're 
              looking to find study partners, share campus moments, or simply stay connected with classmates, 
              Campus Fenix has everything you need.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3">Our Features</h3>
            <ul className="space-y-2">
              <li>• Social networking for students</li>
              <li>• Real-time messaging and group chats</li>
              <li>• Photo and video sharing</li>
              <li>• Interactive games and entertainment</li>
              <li>• Event discovery and campus news</li>
              <li>• Privacy-focused design</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3">Get Started</h3>
            <p className="mb-3">
              Joining Campus Fenix is completely free. Create an account with your email, set up your profile, 
              and start connecting with your campus community today. Available on web and optimized for all devices.
            </p>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/signup">Sign Up</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link to="/login">Log In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicLanding;
