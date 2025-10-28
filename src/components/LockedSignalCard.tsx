import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LockedSignalCardProps {
  name: string;
  symbol: string;
}

const LockedSignalCard: React.FC<LockedSignalCardProps> = ({ name, symbol }) => {
  return (
    <Card className="relative overflow-hidden border-dashed">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
        <Lock className="h-8 w-8 text-primary mb-3" />
        <p className="font-semibold mb-3">Bu sinyali görmek için Profesyonel plana geçin.</p>
        <Link to="/pricing">
          <Button size="sm">Planları Görüntüle</Button>
        </Link>
      </div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarFallback>{symbol.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg font-medium">{name}</CardTitle>
            <p className="text-sm text-muted-foreground">{symbol}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-muted-foreground/50">$----.--</div>
        <div className="flex items-center text-sm text-muted-foreground/50">
          <span>--.--% (24s)</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LockedSignalCard;