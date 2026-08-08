// app-api-invoices-[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================
// GET - Fetch a single invoice by ID
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        user: true,
        client: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// ============================================
// PUT - Update an invoice
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { number, clientName, amount, dueDate, status, clientId } = body

    // Validate required fields
    if (!clientName || !amount || !dueDate || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: clientName, amount, dueDate, status' },
        { status: 400 }
      )
    }

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        number: number || existingInvoice.number,
        clientName,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        status,
        clientId: clientId || existingInvoice.clientId,
      },
      include: {
        user: true,
        client: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// ============================================
// PATCH - Partially update invoice (mark as paid, etc.)
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status, paidAt } = body

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (status) {
      updateData.status = status
      // If marking as paid, set paidAt
      if (status === 'paid') {
        updateData.paidAt = new Date()
      }
    }

    if (paidAt) {
      updateData.paidAt = new Date(paidAt)
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        client: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
    })
  } catch (error) {
    console.error('Error updating invoice status:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice status' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Delete an invoice
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      )
    }

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Delete the invoice
    await prisma.invoice.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: `Invoice ${id} deleted successfully`,
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
// app-api-invoices-[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================
// VALIDATION HELPER (inside the same file)
// ============================================
function validateInvoice(data: any) {
  const errors: string[] = []

  if (!data.clientName || data.clientName.trim().length === 0) {
    errors.push('Client name is required')
  }

  if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
    errors.push('Amount must be a positive number')
  }

  if (!data.dueDate || isNaN(new Date(data.dueDate).getTime())) {
    errors.push('Valid due date is required')
  }

  if (!data.status || !['pending', 'paid', 'overdue', 'cancelled'].includes(data.status)) {
    errors.push('Status must be: pending, paid, overdue, or cancelled')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ============================================
// GET - Fetch a single invoice by ID
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        user: true,
        client: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// ============================================
// PUT - Update an invoice (WITH VALIDATION)
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { number, clientName, amount, dueDate, status, clientId } = body

    // ✅ VALIDATION IS HERE
    const validation = validateInvoice(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors 
        },
        { status: 400 }
      )
    }

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        number: number || existingInvoice.number,
        clientName,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        status,
        clientId: clientId || existingInvoice.clientId,
      },
      include: {
        user: true,
        client: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// ============================================
// PATCH - Partially update invoice
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status, paidAt } = body

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}

    if (status) {
      // ✅ Validate status
      if (!['pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be: pending, paid, overdue, or cancelled' },
          { status: 400 }
        )
      }
      updateData.status = status
      if (status === 'paid') {
        updateData.paidAt = new Date()
      }
    }

    if (paidAt) {
      updateData.paidAt = new Date(paidAt)
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        client: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
    })
  } catch (error) {
    console.error('Error updating invoice status:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice status' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Delete an invoice
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID' },
        { status: 400 }
      )
    }

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    await prisma.invoice.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: `Invoice ${id} deleted successfully`,
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}