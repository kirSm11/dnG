import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllLoans, createLoan, deleteLoan } from "@/lib/models";
import { mockLoans } from "@/lib/mock-data";

const createLoanSchema = z.object({
  name: z.string().min(1).max(200),
  amount: z.number().positive(),
  term: z.number().int().positive(),
  rate: z.number().min(0).max(100),
  paymentDay: z.number().int().min(1).max(31),
});

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const loans = await getAllLoans();
      return NextResponse.json(loans);
    } catch {
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockLoans);
}

export async function POST(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createLoanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const loan = await createLoan({
      name: parsed.data.name,
      amount: parsed.data.amount,
      term: parsed.data.term,
      rate: parsed.data.rate,
      paymentDay: parsed.data.paymentDay,
      remainingAmount: parsed.data.amount,
    });

    return NextResponse.json(loan, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Ошибка создания кредита" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Параметр id обязателен" },
        { status: 400 }
      );
    }

    await deleteLoan(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Ошибка удаления кредита" },
      { status: 500 }
    );
  }
}
