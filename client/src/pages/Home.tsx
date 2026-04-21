import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Users, Zap } from 'lucide-react';

/**
 * Modern Minimalist Design: Landing Page
 * - Asymmetric layout with generous whitespace
 * - Clear value proposition
 * - Elegant typography hierarchy
 */

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/feed');
    }
  }, [isAuthenticated, setLocation]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" key="home-page">
      {/* Navigation */}
      <nav className="border-b border-border bg-card shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Wave Connect</h1>
          <div className="flex gap-3">
            <Button
              onClick={() => setLocation('/login')}
              variant="outline"
              className="border-border hover:bg-secondary"
            >
              Sign In
            </Button>
            <Button
              onClick={() => setLocation('/register')}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold text-primary leading-tight">
                Connect with Others,
                <span className="text-accent"> Share Your Wave</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Wave Connect is a modern social platform designed for meaningful conversations,
                authentic connections, and seamless communication. Share your thoughts, engage with
                your community, and stay connected.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setLocation('/register')}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6 text-base"
              >
                Create Account
              </Button>
              <Button
                onClick={() => setLocation('/login')}
                variant="outline"
                className="border-border hover:bg-secondary font-semibold py-6 text-base"
              >
                Sign In
              </Button>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-primary/10 rounded-3xl blur-3xl" />
              <div className="relative bg-card border border-border rounded-3xl p-8 shadow-lg space-y-6">
                <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                  <MessageCircle className="text-accent" size={24} />
                  <div>
                    <p className="font-semibold text-foreground">Real-time Chat</p>
                    <p className="text-sm text-muted-foreground">Instant messaging</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                  <Users className="text-accent" size={24} />
                  <div>
                    <p className="font-semibold text-foreground">Connect</p>
                    <p className="text-sm text-muted-foreground">Build your network</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                  <Zap className="text-accent" size={24} />
                  <div>
                    <p className="font-semibold text-foreground">Share</p>
                    <p className="text-sm text-muted-foreground">Express yourself</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-card border-y border-border py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-primary mb-4">Features</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for meaningful social connections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="space-y-4">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                <MessageCircle className="text-accent" size={24} />
              </div>
              <h4 className="text-xl font-semibold text-foreground">Messaging</h4>
              <p className="text-muted-foreground">
                Send and receive messages in real-time with WebSocket support for instant communication.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-4">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                <Users className="text-accent" size={24} />
              </div>
              <h4 className="text-xl font-semibold text-foreground">Profiles</h4>
              <p className="text-muted-foreground">
                Create and customize your profile to showcase your personality and connect with others.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-4">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                <Zap className="text-accent" size={24} />
              </div>
              <h4 className="text-xl font-semibold text-foreground">Feed</h4>
              <p className="text-muted-foreground">
                Share your thoughts and publications with your network in a clean, organized feed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h3 className="text-3xl font-bold text-primary">Ready to Connect?</h3>
            <p className="text-lg text-muted-foreground">
              Join Wave Connect today and start building meaningful connections with your community.
            </p>
          </div>

          <Button
            onClick={() => setLocation('/register')}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6 text-base px-8"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container text-center text-muted-foreground text-sm">
          <p>&copy; 2026 Wave Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
