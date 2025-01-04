"use server";
import { z } from "zod";
import { getSqlClient } from "@/app/lib/data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const FormScheam = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error:  'Please select a customer',
    }),
    amount: z.coerce.number().gt(0, 'Amount must be greater than 0'),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status',
    }),
    date: z.string(),
});

const CreateInvoice = FormScheam.omit({ id: true, date: true });

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    },
    message? : string | null;
};

export async function createInvoice(prevState: State, formData: FormData): Promise<State> {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })
    if (!validatedFields.success) {
        return {
            errors:validatedFields.error.flatten().fieldErrors,
            message: 'Missing fields. Failed to create invoice!',
        }
    }
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    const client = await getSqlClient();
    try {
        await client.sql`INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
        revalidatePath('/dashboard/invoices');
        return {
            message: 'Invoice created successfully!',
        };
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Database Error: Failed to Create Invoice.',
        };
    }
}

export async function updateInvoice(id: string, _: State, formData: FormData): Promise<State> {
    const UpdateInvoice = FormScheam.omit({ date: true });
    formData.set('id', id);
    const validatedFields = UpdateInvoice.safeParse({
        id: formData.get('id'),
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing fields. Failed to update invoice!',
        }
    }
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    try {
        const client = await getSqlClient();
        await client.sql`UPDATE invoices SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status} WHERE id = ${id}`;
        return {
            message: 'Invoice updated successfully!',
        }
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Database Error: Failed to update invoice.',
        }
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    try {
        const client = await getSqlClient();
        await client.sql`DELETE FROM invoices WHERE id = ${id}`;
        
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to delete invoice');
    }
    revalidatePath('/dashboard/invoices');
}


export async function authenticate(
    prevState: string | undefined,
    formData: FormData
){
    try {
        console.log("PREVSTATE",prevState);
        await signIn('credentials', formData);
    } catch(error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin': 
                    return 'Invalid username or password';
                default:
                    return 'Failed to sign in';
            }
        }
        throw error;
    }
}