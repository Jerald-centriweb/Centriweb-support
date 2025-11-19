import React, { useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { LifeBuoy, FileText, Zap } from 'lucide-react';

export const SupportPage = () => {
  
  useEffect(() => {
    // Load the GHL script dynamically
    const script = document.createElement('script');
    script.src = "https://link.centriweb.com/js/form_embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
      {/* Info Column */}
      <div className="lg:col-span-1 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Submit a Ticket</h1>
          <p className="text-slate-400">Our team usually responds within 2-4 hours during business days.</p>
        </div>

        <Card className="bg-gradient-to-br from-blue-900/20 to-slate-900/50 border-blue-800/30">
          <div className="p-5">
            <h3 className="flex items-center gap-2 text-white font-semibold mb-3">
              <Zap className="w-4 h-4 text-yellow-400" /> Before you submit...
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-2">
                <span className="text-slate-500">1.</span> Check the <strong>Guides</strong> section for instant answers.
              </li>
              <li className="flex gap-2">
                <span className="text-slate-500">2.</span> Ask the <strong>AI Assistant</strong> to troubleshoot.
              </li>
              <li className="flex gap-2">
                <span className="text-slate-500">3.</span> Include screenshots if possible.
              </li>
            </ul>
          </div>
        </Card>
        
        <div className="bg-slate-900/50 rounded-xl p-5 border border-dark-border">
           <h4 className="text-white font-medium mb-2 flex items-center gap-2"><LifeBuoy className="w-4 h-4" /> Emergency?</h4>
           <p className="text-sm text-slate-400">If your system is completely down, please mark the priority as "Critical" in the form.</p>
        </div>
      </div>

      {/* Form Column */}
      <div className="lg:col-span-2">
        <Card className="bg-white h-full min-h-[800px]">
           {/* 
             Using a white background for the card because GHL forms often have 
             white backgrounds hardcoded or look better on light substrates unless custom CSS is injected into the iframe.
           */}
           <div className="w-full h-full overflow-hidden rounded-xl">
            <iframe
                src="https://link.centriweb.com/widget/form/YeI4hfsgWG9C6IosdXTn"
                style={{ width: '100%', height: '100%', border: 'none', minHeight: '800px' }}
                id="inline-YeI4hfsgWG9C6IosdXTn" 
                data-layout="{'id':'INLINE'}"
                data-trigger-type="alwaysShow"
                data-trigger-value=""
                data-activation-type="alwaysActivated"
                data-activation-value=""
                data-deactivation-type="neverDeactivate"
                data-deactivation-value=""
                data-form-name="Form 17"
                data-height="1161"
                data-layout-iframe-id="inline-YeI4hfsgWG9C6IosdXTn"
                data-form-id="YeI4hfsgWG9C6IosdXTn"
                title="Support Ticket Form"
            ></iframe>
           </div>
        </Card>
      </div>
    </div>
  );
};
