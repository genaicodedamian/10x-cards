import React from 'react';
import { Button } from '@/components/ui/button'; // Shadcn/ui Button
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon, LayoutDashboardIcon } from 'lucide-react'; // Or other relevant icons

const StudyCompletionSummary: React.FC = () => {
  return (
    <Card className="w-full max-w-lg text-center shadow-xl bg-gray-800 text-gray-200 rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-green-500">
          Gratulacje!
        </CardTitle>
        <CardDescription className="text-lg text-gray-300">
          Ukończyłeś naukę tego zestawu fiszek.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
        <Button asChild variant="outline" size="lg">
          <a href="/my-flashcards">
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            Wróć do Listy Zestawów
          </a>
        </Button>
        <Button asChild variant="default" size="lg">
          <a href="/dashboard">
            <LayoutDashboardIcon className="mr-2 h-5 w-5" />
            Wróć do Dashboardu
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};

export default StudyCompletionSummary; 