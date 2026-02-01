import React from 'react';
import { Link } from 'react-router-dom';
import { Separator } from '@/component/ui/separator';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Campus Fenix</h3>
            <p className="text-sm text-muted-foreground">
              The social platform built for students. Connect with classmates, share moments, and build your campus community.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/games" className="text-muted-foreground hover:text-primary transition-colors">
                  Games
                </Link>
              </li>
              <li>
                <Link to="/friends" className="text-muted-foreground hover:text-primary transition-colors">
                  Find Friends
                </Link>
              </li>
              <li>
                <Link to="/messages" className="text-muted-foreground hover:text-primary transition-colors">
                  Messages
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/settings" className="text-muted-foreground hover:text-primary transition-colors">
                  Settings
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground">Help Center</span>
              </li>
              <li>
                <span className="text-muted-foreground">Privacy Policy</span>
              </li>
              <li>
                <span className="text-muted-foreground">Terms of Service</span>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-muted-foreground">Community Guidelines</span>
              </li>
              <li>
                <span className="text-muted-foreground">Safety Tips</span>
              </li>
              <li>
                <span className="text-muted-foreground">Blog</span>
              </li>
              <li>
                <span className="text-muted-foreground">Careers</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="mb-4" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} Campus Fenix. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Made with ❤️ for students</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
