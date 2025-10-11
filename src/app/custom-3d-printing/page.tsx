import Custom3DPrintingForm from '@/components/Custom3DPrintingForm'

export default function Custom3DPrintingPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Custom 3D Printing</h1>
          <p className="text-xl text-text-secondary">
            Upload your designs and receive a detailed quote. From rapid prototypes to production runs,
            we bring your ideas to life with precision manufacturing.
          </p>
        </div>

        {/* Process Steps */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xl mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Upload Files</h3>
              <p className="text-sm text-text-secondary">Send us your .STL, .OBJ, or .STEP files</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xl mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Select Options</h3>
              <p className="text-sm text-text-secondary">Choose material, finish, color, and quantity</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xl mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Get Quote</h3>
              <p className="text-sm text-text-secondary">Receive detailed pricing within 24 hours</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xl mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">We Manufacture</h3>
              <p className="text-sm text-text-secondary">Your parts printed and shipped quickly</p>
            </div>
          </div>
        </div>

        {/* Quote Form */}
        <div className="max-w-4xl mx-auto">
          <div className="border border-border rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-8">Request a Quote</h2>
            <Custom3DPrintingForm />
          </div>
        </div>

        {/* Capabilities */}
        <div className="max-w-5xl mx-auto mt-20">
          <h2 className="text-3xl font-bold mb-8">Our Capabilities</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="border border-border rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-4">Materials</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• PLA (Biodegradable)</li>
                <li>• ABS (Heat Resistant)</li>
                <li>• PETG (Durable)</li>
                <li>• Nylon (Strong)</li>
                <li>• TPU (Flexible)</li>
                <li>• Resin (High Detail)</li>
              </ul>
            </div>
            <div className="border border-border rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-4">Volume</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• Build area: 300x300x400mm</li>
                <li>• Prototypes (1-10 parts)</li>
                <li>• Small batch (10-100 parts)</li>
                <li>• Production runs (100+ parts)</li>
              </ul>
            </div>
            <div className="border border-border rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-4">Finishing</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• Standard (as-printed)</li>
                <li>• Sanding & smoothing</li>
                <li>• Painting & coating</li>
                <li>• Assembly services</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Custom 3D Printing Services - 47 Industries',
  description: 'Upload your 3D files and get instant quotes for custom 3D printing. From prototypes to production.',
}
