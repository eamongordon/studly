import { Button } from "@/components/ui/button"
import { Lightbulb } from "lucide-react"
export default function Home() {
  return (
    <div>
      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background lightbulb icons */}
      <div className="absolute inset-0 pointer-events-none">
        <Lightbulb className="absolute top-20 left-16 w-6 h-6 text-gray-300 opacity-60" />
        <Lightbulb className="absolute top-32 right-20 w-5 h-5 text-gray-300 opacity-40" />
        <Lightbulb className="absolute top-40 left-1/3 w-4 h-4 text-gray-300 opacity-50" />
        <Lightbulb className="absolute top-52 right-1/3 w-6 h-6 text-gray-300 opacity-30" />
        <Lightbulb className="absolute top-64 left-1/4 w-5 h-5 text-gray-300 opacity-45" />
        <Lightbulb className="absolute bottom-40 left-12 w-4 h-4 text-gray-300 opacity-35" />
        <Lightbulb className="absolute bottom-52 right-16 w-6 h-6 text-gray-300 opacity-50" />
        <Lightbulb className="absolute bottom-64 left-1/2 w-5 h-5 text-gray-300 opacity-40" />
        <Lightbulb className="absolute bottom-32 right-1/4 w-4 h-4 text-gray-300 opacity-60" />
        <Lightbulb className="absolute bottom-20 left-1/3 w-6 h-6 text-gray-300 opacity-30" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          
          <span className="text-xl font-semibold text-gray-800">Stud.ly</span>
          <img src="/lightbulb.svg" alt="Lightbulb" height={20} width={20} />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent">
            Sign up
          </Button>
          <Button className="bg-rose-300 hover:bg-rose-400 text-gray-800 border-0">Log in</Button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 font-medium">Lorem ipsum</p>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight text-balance">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit
              </h1>
            </div>
          </div>

          {/* Right side - File upload area */}
          <div className="relative">    
          </div>
        </div>

        {/* Bottom section - Methods */}
        <div className="mt-20 pt-12 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          </div>
        </div>
      </main>
    </div>
    </div>
  );
}
