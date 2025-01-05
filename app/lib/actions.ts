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
    status: z.enum(['pending', 'paid', 'late'], {
        invalid_type_error: 'Please select an invoice status',
    }),
    date: z.string(),
    description: z.string()
});

const CreateInvoice = FormScheam.omit({ id: true, date: true });

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
        description?: string[]
    },
    message? : string | null;
};

export async function createInvoice(prevState: State, formData: FormData): Promise<State> {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
        description: formData.get('description')
    })
    if (!validatedFields.success) {
        return {
            errors:validatedFields.error.flatten().fieldErrors,
            message: 'Missing fields. Failed to create invoice!',
        }
    }
    const { customerId, amount, status, description } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    const client = await getSqlClient();
    try {
        await client.sql`INSERT INTO invoices (customer_id, amount, status, date, description) VALUES (${customerId}, ${amountInCents}, ${status}, ${date}, ${description})`;
        revalidatePath('/dashboard/invoices');
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Database Error: Failed to Create Invoice.',
        };
    } finally {
        client.end();
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices')
}

export async function updateInvoice(id: string, _: State, formData: FormData): Promise<State> {
    const UpdateInvoice = FormScheam.omit({ date: true });
    formData.set('id', id);
    const validatedFields = UpdateInvoice.safeParse({
        id: formData.get('id'),
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
        description: formData.get('description')
    })
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing fields. Failed to update invoice!',
        }
    }
    const { customerId, amount, status, description } = validatedFields.data;
    const amountInCents = amount * 100;
    const client = await getSqlClient();
    try {
        await client.sql`UPDATE invoices SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}, description = ${description} WHERE id = ${id}`;
        
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Database Error: Failed to update invoice.',
        }
    } finally {
        client.end();
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    const client = await getSqlClient();
    try {
        await client.sql`DELETE FROM invoices WHERE id = ${id}`;
        
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to delete invoice');
    } finally {
        client.end();
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