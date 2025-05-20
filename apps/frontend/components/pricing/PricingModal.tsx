"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { useProjectContext } from "@/context/project.context"
import { cn } from "@/lib/utils"
import { pricingData } from "@halogen/common/index"

export function PricingModal() {
  const { state, updateProjectState } = useProjectContext()
  
  const handleClose = () => {
    updateProjectState({ showPricing: false })
  }

  return (    <Dialog open={state.showPricing} onOpenChange={(open) => updateProjectState({ showPricing: open })}>
      <DialogContent className="max-w-7xl min-w-[1500px] p-0 overflow-auto max-h-[95vh] select-none">
        <DialogHeader className="p-8 md:p-10 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
          <DialogTitle className="text-4xl font-bold text-center">Choose Your Plan</DialogTitle>
          <DialogDescription className="text-center text-xl mt-3 max-w-2xl mx-auto">
            Scale your project with the right features at the right price
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8 md:p-10">
          {pricingData.map((plan) => (
            <Card key={plan.tier} className={cn(
              "flex flex-col h-full transition-all py-0 hover:shadow-md relative",
              plan.tier === 2 ? "border-primary shadow-sm" : ""
            )}>              <CardHeader className={cn(
                "p-8",
                plan.tier === 2 ? "bg-primary/10" : "bg-muted/40"
              )}>
                <div className="space-y-2.5">
                  {plan.tier === 2 && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-4 py-1.5 rounded-full">
                      POPULAR
                    </div>
                  )}
                  <CardTitle className="text-2xl font-bold text-center">{plan.name}</CardTitle>
                  <CardDescription className="text-center flex items-center justify-center gap-default">
                    <span className="block text-4xl font-bold mt-3">
                      {plan.ngnAmount === 0 ? "Free" : `₦${plan.ngnAmount.toLocaleString()}`}
                    </span>
                    {plan.ngnAmount > 0 && <span className="text-sm self-end">/month</span>}
                  </CardDescription>
                </div>
              </CardHeader>              <CardContent className="flex-grow px-8 pt-6 pb-2">
                <ul className="space-y-4 mt-4">
                  <PricingFeature included={true}>{`${plan.maxPages} pages`}</PricingFeature>
                  <PricingFeature included={true}>{`${plan.cmsCollectionLimit} collections`}</PricingFeature>
                  <PricingFeature included={true}>{`${plan.storageLimitInGB}GB storage`}</PricingFeature>
                  <PricingFeature included={true}>{`${plan.teamMemberLimit} team members`}</PricingFeature>
                  <PricingFeature included={true}>{`${plan.monthlyPageVisitLimit.toLocaleString()} monthly page visits`}</PricingFeature>
                  <PricingFeature included={plan.prioritySupport}>Priority support</PricingFeature>
                  <PricingFeature included={plan.customDomain}>Custom domain</PricingFeature>
                  <PricingFeature included={!plan.brandingBadge}>Remove branding</PricingFeature>
                </ul>
              </CardContent>              <CardFooter className="px-8 py-6">
                <Button 
                  className={cn(
                    "w-full py-6 text-base font-medium", 
                    plan.tier === 2 
                      ? "shadow-md" 
                      : "variant-outline"
                  )}
                  size="lg"
                  variant={plan.tier === 2 ? "default" : "outline"}
                >
                  {plan.tier === 0 ? "Get Started" : "Upgrade to " + plan.name}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>        <div className="p-8 md:p-10 border-t flex justify-center">
          <DialogClose asChild>
            <Button variant="ghost" onClick={handleClose} size="lg" className="text-base px-8">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PricingFeature({ included, children }: { included: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      {included ? (
        <Check className="h-5 w-5 text-primary" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground" />
      )}
      <span className={cn(
        "text-base",
        included ? "" : "text-muted-foreground line-through"
      )}>
        {children}
      </span>
    </li>
  )
}
