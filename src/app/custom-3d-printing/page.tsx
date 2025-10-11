"use client"

import { useState } from 'react'

export default function Custom3DPrintingPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    material: 'PLA',
    finish: 'Standard',
    color: 'Black',
    quantity: 1,
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement form submission to API
    alert('Form submission will be implemented with backend!')
  }

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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                    placeholder="Company Name"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">3D Files *</label>
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-accent transition-colors cursor-pointer">
                  <input type="file" multiple accept=".stl,.obj,.step,.stp" className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="text-4xl mb-4">📁</div>
                    <p className="text-lg font-medium mb-2">Drop your files here or click to browse</p>
                    <p className="text-sm text-text-secondary">Supports .STL, .OBJ, .STEP files (Max 50MB)</p>
                  </label>
                </div>
              </div>

              {/* Print Specifications */}
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Material *</label>
                  <select
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                  >
                    <option>PLA</option>
                    <option>ABS</option>
                    <option>PETG</option>
                    <option>Nylon</option>
                    <option>TPU (Flexible)</option>
                    <option>Resin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Finish *</label>
                  <select
                    value={formData.finish}
                    onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                  >
                    <option>Standard</option>
                    <option>Smooth</option>
                    <option>High Detail</option>
                    <option>Painted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Color *</label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                  >
                    <option>Black</option>
                    <option>White</option>
                    <option>Gray</option>
                    <option>Red</option>
                    <option>Blue</option>
                    <option>Green</option>
                    <option>Yellow</option>
                    <option>Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent resize-none"
                  placeholder="Any special requirements, deadlines, or questions..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-text-primary text-background rounded-lg font-semibold hover:bg-text-secondary transition-all"
              >
                Submit Quote Request
              </button>
            </form>
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
