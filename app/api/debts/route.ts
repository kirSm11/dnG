import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllDebts, createDebt, deleteDebt } from "@/lib/models";
import { mockDebts } from "@/lib/mock-data";

const createDebtSchema = z.object({
  name: z.string().min(1).max(200),
  amount: z.number().positive(),
});

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const debts = await getAllDebts();
      return NextResponse.json(debts);
    } catch {
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockDebts);
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
    const parsed = createDebtSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const debt = await createDebt({
      name: parsed.data.name,
      amount: parsed.data.amount,
      remainingAmount: parsed.data.amount,
    });

    return NextResponse.json(debt, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Ошибка создания долга" },
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

    await deleteDebt(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Ошибка удаления долга" },
      { status: 500 }
    );
  }
}