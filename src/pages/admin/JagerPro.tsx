import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Palette, User, Phone, Mail, FileText, ArrowRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface JagerProRequest {
  id: string;
  user_id: string;
  name: string;
  whatsapp: string | null;
  email: string | null;
  quantity: number | null;
  brief: string;
  status: string;
  assigned_designer_id: string | null;
  customer_files: string[] | null;
  designer_files: string[] | null;
  approved_mockup_url: string | null;
  notes: string | null;
  order_id: string | null;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  new_request: "bg-blue-500",
  brief_review: "bg-yellow-500",
  assigned_to_designer: "bg-purple-500",
  design_in_progress: "bg-orange-500",
  waiting_for_approval: "bg-indigo-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  converted_to_order: "bg-gray-500",
};

const JagerPro = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [selectedRequest, setSelectedRequest] = useState<JagerProRequest | null>(null);
  const queryClient = useQueryClient();

  // Fetch requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin', 'jager-pro', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('jager_pro_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as JagerProRequest[];
    },
  });

  // Fetch admin users (for designer assignment)
  const { data: designers } = useQuery({
    queryKey: ['admin', 'designers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, role')
        .in('role', ['admin', 'designer']);

      if (error) throw error;
      return data || [];
    },
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ requestId, newStatus }: { requestId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('jager_pro_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'jager-pro'] });
      toast.success("Status updated");
    },
  });

  // Assign designer mutation
  const assignDesigner = useMutation({
    mutationFn: async ({ requestId, designerId }: { requestId: string; designerId: string }) => {
      const { error } = await supabase
        .from('jager_pro_requests')
        .update({ 
          assigned_designer_id: designerId,
          status: 'assigned_to_designer'
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'jager-pro'] });
      toast.success("Designer assigned");
    },
  });

  // Convert to order mutation
  const convertToOrder = useMutation({
    mutationFn: async (request: JagerProRequest) => {
      // TODO: Create order from request
      // For now, just update status
      const { error } = await supabase
        .from('jager_pro_requests')
        .update({ status: 'converted_to_order' })
        .eq('id', request.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'jager-pro'] });
      toast.success("Request converted to order");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Jager Pro Requests</h1>
          <p className="text-grey-text mt-1">Manage custom design requests</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading font-bold uppercase text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              searchParams.set('status', value === 'all' ? '' : value);
              setSearchParams(searchParams);
            }}
          >
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new_request">New Request</SelectItem>
              <SelectItem value="brief_review">Brief Review</SelectItem>
              <SelectItem value="assigned_to_designer">Assigned to Designer</SelectItem>
              <SelectItem value="design_in_progress">Design in Progress</SelectItem>
              <SelectItem value="waiting_for_approval">Waiting for Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="converted_to_order">Converted to Order</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-12 gap-4">
                  <div className="md:col-span-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={`${statusColors[request.status] || 'bg-gray-500'} text-white uppercase text-xs`}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-grey-text">
                        {format(new Date(request.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-grey-text" />
                        <span className="font-heading font-bold">{request.name}</span>
                      </div>
                      {request.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-grey-text" />
                          <span className="text-sm">{request.email}</span>
                        </div>
                      )}
                      {request.whatsapp && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-grey-text" />
                          <span className="text-sm">{request.whatsapp}</span>
                        </div>
                      )}
                      {request.quantity && (
                        <p className="text-sm text-grey-text">Quantity: {request.quantity}</p>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-4">
                    <Label className="text-sm font-heading font-bold uppercase mb-2 block">Brief</Label>
                    <p className="text-sm text-grey-text line-clamp-3">{request.brief}</p>
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                      className="w-full"
                    >
                      View Details
                    </Button>
                    {request.status === 'approved' && !request.order_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => convertToOrder.mutate(request)}
                        disabled={convertToOrder.isPending}
                        className="w-full"
                      >
                        Convert to Order
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Palette className="h-16 w-16 text-grey-text mx-auto mb-4" />
            <p className="text-grey-text">No requests found</p>
          </CardContent>
        </Card>
      )}

      {/* Request Detail Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={(open) => {
          if (!open) setSelectedRequest(null);
        }}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold uppercase">
                Request Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <Label className="text-sm font-heading font-bold uppercase mb-3 block">Customer Information</Label>
                <div className="space-y-2">
                  <p className="text-sm"><strong>Name:</strong> {selectedRequest.name}</p>
                  {selectedRequest.email && (
                    <p className="text-sm"><strong>Email:</strong> {selectedRequest.email}</p>
                  )}
                  {selectedRequest.whatsapp && (
                    <p className="text-sm"><strong>WhatsApp:</strong> {selectedRequest.whatsapp}</p>
                  )}
                  {selectedRequest.quantity && (
                    <p className="text-sm"><strong>Quantity:</strong> {selectedRequest.quantity}</p>
                  )}
                </div>
              </div>

              {/* Brief */}
              <div>
                <Label className="text-sm font-heading font-bold uppercase mb-3 block">Project Brief</Label>
                <p className="text-sm whitespace-pre-wrap">{selectedRequest.brief}</p>
              </div>

              {/* Files */}
              {selectedRequest.customer_files && selectedRequest.customer_files.length > 0 && (
                <div>
                  <Label className="text-sm font-heading font-bold uppercase mb-3 block">Customer Files</Label>
                  <div className="space-y-2">
                    {selectedRequest.customer_files.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-jager-red underline flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        File {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-4 pt-4 border-t border-foreground">
                <div>
                  <Label className="text-sm font-heading font-bold uppercase mb-2 block">Update Status</Label>
                  <Select
                    value={selectedRequest.status}
                    onValueChange={(value) => updateStatus.mutate({ requestId: selectedRequest.id, newStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_request">New Request</SelectItem>
                      <SelectItem value="brief_review">Brief Review</SelectItem>
                      <SelectItem value="assigned_to_designer">Assigned to Designer</SelectItem>
                      <SelectItem value="design_in_progress">Design in Progress</SelectItem>
                      <SelectItem value="waiting_for_approval">Waiting for Approval</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedRequest.status === 'new_request' || selectedRequest.status === 'brief_review' && (
                  <div>
                    <Label className="text-sm font-heading font-bold uppercase mb-2 block">Assign Designer</Label>
                    <Select
                      value={selectedRequest.assigned_designer_id || ""}
                      onValueChange={(value) => assignDesigner.mutate({ requestId: selectedRequest.id, designerId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select designer" />
                      </SelectTrigger>
                      <SelectContent>
                        {designers?.map((designer) => (
                          <SelectItem key={designer.id} value={designer.id}>
                            Designer {designer.id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedRequest.status === 'approved' && !selectedRequest.order_id && (
                  <Button
                    onClick={() => convertToOrder.mutate(selectedRequest)}
                    disabled={convertToOrder.isPending}
                    className="w-full"
                  >
                    {convertToOrder.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        Convert to Order <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}

                {selectedRequest.order_id && (
                  <Link to={`/admin/orders/${selectedRequest.order_id}`}>
                    <Button variant="outline" className="w-full">
                      View Order
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default JagerPro;

