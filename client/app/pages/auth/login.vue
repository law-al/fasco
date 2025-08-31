<template>
  <div
    class="bg-[url('../../assets/auth-login.jpg')] bg-center bg-no-repeat bg-cover"
  ></div>
  <div class="min-h-[500px] flex items-center">
    <div class="space-y-5 font-primary p-3 w-full">
      <h2 class="font-secondary font-bold text-6xl mb-[40px]">Fasco</h2>

      <div class="flex flex-col justify-center space-y-6 items-center mx-10">
        <error-outlet :error="formError" />
        <p class="text-xl mb-2 items-start mt-1.5">Login to Fasco</p>
        <div class="flex items-center gap-8 w-full mt-5">
          <u-button
            icon="i-flat-color-icons-google"
            variant="outline"
            size="xl"
            to="/google.com"
            class="flex-1 justify-center"
            >Sign in with Google</u-button
          >

          <u-button
            icon="i-logos-google-gmail"
            variant="outline"
            size="xl"
            to="/gmail.com"
            class="flex-1 justify-center"
            >Sign in with Gmail</u-button
          >
        </div>

        <p class="text-gray-700">- OR -</p>

        <client-only>
          <error-outlet v-if="formError">{{ formError }}</error-outlet>
          <form
            @submit.prevent="onSubmit"
            class="flex flex-col space-y-6 w-full"
          >
            <div class="flex items-start gap-2 w-full">
              <!-- Changed items-center to items-start -->
              <div class="flex flex-col gap-0.5 flex-1">
                <!-- Added flex-1 to take full width -->
                <input
                  id="email"
                  :class="
                    cn(
                      'w-full bg-white border-b-2 border-gray-400 flex h-[35px] appearance-none items-center px-[10px] text-sm leading-none outline-none selection:color-white selection:bg-blackA9'
                    )
                  "
                  type="email"
                  placeholder="Email Address"
                  v-model="email"
                  v-bind="emailAttr"
                />
                <error-outlet :error="errors.email" />
              </div>
            </div>

            <div class="flex flex-col items-start gap-2 w-full">
              <UInput
                v-model="password"
                v-bind="passwordAttr"
                placeholder="Password"
                class="border-b-2 border-gray-400 outline-0 w-full"
                :type="show ? 'text' : 'password'"
                :ui="{
                  base: '!ring-0 focus:!ring-0 focus-visible:!ring-0',
                  trailing: 'pe-1',
                }"
              >
                <template #trailing>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :aria-label="show ? 'Hide password' : 'Show password'"
                    :aria-pressed="show"
                    aria-controls="password"
                    @click="show = !show"
                  />
                </template>
              </UInput>
              <error-outlet :error="errors.password" />
            </div>

            <u-button
              type="submit"
              :loading="isLoading"
              size="xl"
              class="flex justify-center !bg-black cursor-pointer hover:bg-black/80 active:bg-black"
              >Login</u-button
            >
          </form>
        </client-only>

        <u-button
          to="/auth/register"
          size="xl"
          variant="outline"
          class="w-full justify-center -mt-3"
          >Register now</u-button
        >

        <nuxt-link
          to="/auth/forgot-password"
          class="text-indigo-500 w-full text-right -mt-4 font-semibold"
          >Forgot Password?</nuxt-link
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

definePageMeta({
  layout: 'auth-layout',
});

const router = useRouter();
const route = useRoute();
const toast = useToast();

/* ------------------------------
   Store
--------------------------------*/
const userStore = useUserStore();
const cartStore = useCartStore();

const schema = toTypedSchema(
  yup.object({
    email: yup
      .string()
      .email('Please enter a valid email')
      .required('Email is required'),
    password: yup.string().required(),
  })
);

const { defineField, errors, handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: {
    email: '',
    phone: '',
  },
});

const [email, emailAttr] = defineField('email');
const [password, passwordAttr] = defineField('password');

const { pending: isLoading } = storeToRefs(userStore);
const formError = ref(null);
const show = ref(false);

async function handleCartMerge() {
  try {
    console.log('Merging cart items...');
    await cartStore.mergeCart();
    console.log('Cart items merged successfully.');
    toast.add({
      title: 'Success',
      description: 'Cart items merged successfully.',
    });
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to merge cart items. Please check your cart items.',
    });
  }
}

const onSubmit = handleSubmit(async values => {
  formError.value = null;

  try {
    await userStore.loginUser(values);
    console.log('Login User');

    const redirect = route.query.redirect;
    const isCheckoutRedirect = redirect === '/checkout';

    if (isCheckoutRedirect) {
      await handleCartMerge();
    } else {
      console.log('This is entered');
      await cartStore.getCart();
    }

    router.replace(redirect || '/');
  } catch (error) {
    formError.value = error || 'Login failed';
  }
});
</script>

<style scoped></style>
