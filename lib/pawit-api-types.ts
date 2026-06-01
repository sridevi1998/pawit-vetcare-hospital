export interface paths {
  "/api/v1/billing": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["BillingResponse"];
          };
        };
      };
    };
  };
  "/api/v1/billing/invoices": {
    post: {
      requestBody: {
        content: {
          "application/json": components["schemas"]["CreateInvoiceRequest"];
        };
      };
      responses: {
        201: {
          content: {
            "application/json": components["schemas"]["InvoiceMutationResult"];
          };
        };
      };
    };
  };
  "/api/v1/billing/invoices/{id}/void": {
    post: {
      requestBody: {
        content: {
          "application/json": components["schemas"]["VoidInvoiceRequest"];
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["InvoiceMutationResult"];
          };
        };
      };
    };
  };
}

export interface components {
  schemas: {
    BillingResponse: {
      metrics: components["schemas"]["Metric"][];
      invoices: Invoice[];
    };
    Metric: {
      label: string;
      value: string;
      delta?: string;
      tone?: string;
    };
    CreateInvoiceRequest: {
      locationId: string;
      petId?: string;
      status: "draft" | "issued";
      dueAt?: string;
      taxCents: number;
      discountCents: number;
      lineItems: InvoiceLineItemInput[];
    };
    InvoiceMutationResult: {
      invoice: Invoice;
      idempotent?: boolean;
    };
    VoidInvoiceRequest: {
      reason: string;
    };
  };
}

export interface Invoice {
  id: string;
  petName: string;
  ownerName: string;
  amount: number;
  status: string;
  dueDate: string;
}

export interface InvoiceLineItemInput {
  description: string;
  quantity: number;
  unitAmountCents: number;
  relatedResourceType?: string;
  relatedResourceId?: string;
}
