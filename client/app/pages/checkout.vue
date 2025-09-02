<template>
  <section class="w-[1200px] mx-auto font-primary">
    <h1 class="text-center text-black text-2xl mb-15">Checkout</h1>

    <div class="grid grid-cols-2 gap-10">
      <div class="">
        <div
          v-if="processingOrderError"
          class="text-red-500 text-center italic"
        >
          {{ processingOrderError }}
        </div>
        <UForm
          :state="state"
          :schema="schema"
          @submit="onSubmit"
          class="text-lg w-full"
        >
          <div class="mb-5">
            <h2 class="text-xl font-semibold mb-2">Contact</h2>

            <UFormField name="email" class="w-full">
              <UInput
                color="neutral"
                placeholder="Email Address"
                :highlight="false"
                class="w-full"
                v-model="state.email"
                size="xl"
                :ui="{
                  base: 'w-full px-4 py-4 ring-1 ring-gray-300 !rounded-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-gray-500',
                }"
              />
            </UFormField>
          </div>

          <div class="">
            <h2 class="text-xl font-semibold mb-2">Delivery</h2>

            <!-- name input -->
            <div class="flex items-start gap-3 mb-2">
              <UFormField name="firstName" class="w-full">
                <UInput
                  color="neutral"
                  placeholder="First Name"
                  :highlight="false"
                  class="w-full"
                  v-model="state.firstName"
                  size="xl"
                  :ui="{
                    base: 'w-full px-4 py-4 ring-1 ring-gray-300 !rounded-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-gray-500',
                  }"
                />
              </UFormField>

              <UFormField name="lastName" class="w-full">
                <UInput
                  color="neutral"
                  placeholder="Last Name"
                  :highlight="false"
                  class="w-full"
                  v-model="state.lastName"
                  size="xl"
                  :ui="{
                    base: 'w-full px-4 py-4 ring-1 ring-gray-300 !rounded-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-gray-500',
                  }"
                />
              </UFormField>
            </div>

            <!-- address -->
            <UFormField name="address" class="w-full mb-2">
              <UInput
                color="neutral"
                placeholder="Address"
                :highlight="false"
                class="w-full"
                v-model="state.address"
                size="xl"
                :ui="{
                  base: 'w-full px-4 py-4 ring-1 ring-gray-300 !rounded-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-gray-500',
                }"
              />
            </UFormField>

            <!-- city and postal input -->
            <div class="flex items-start gap-3 mb-2">
              <UFormField name="city" class="w-full">
                <UInput
                  color="neutral"
                  placeholder="City"
                  :highlight="false"
                  class="w-full"
                  v-model="state.city"
                  size="xl"
                  :ui="{
                    base: 'w-full px-4 py-4 ring-1 ring-gray-300 !rounded-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-gray-500',
                  }"
                />
              </UFormField>

              <UFormField name="postalCode" class="w-full">
                <UInput
                  color="neutral"
                  placeholder="Postal Code"
                  :highlight="false"
                  class="w-full"
                  v-model="state.postalCode"
                  size="xl"
                  :ui="{
                    base: 'w-full px-4 py-4 ring-1 ring-gray-300 !rounded-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-gray-500',
                  }"
                />
              </UFormField>
            </div>

            <!-- country select -->
            <UFormField name="country" class="w-full">
              <USelect
                v-model="state.country"
                :items="countryOptions"
                class="w-full"
                placeholder="Select Country"
                color="neutral"
                size="xl"
                :ui="{
                  base: 'w-full px-4 py-4 ring-1 ring-gray-300 ring-1 !rounded-none focus:outline-none focus-visible:outline-none focus:ring-1 focus-visible:ring-2 focus-visible:ring-gray-500',
                }"
              />
            </UFormField>
          </div>

          <UButton
            type="submit"
            color="primary"
            class="w-full mt-5 !rounded-none py-4 justify-center !bg-black text-white cursor-pointer"
            :loading="processingOrder"
            >Complete Order</UButton
          >
        </UForm>

        <div class="mt-5">
          <div
            id="error-message"
            v-if="processingPaymentError"
            class="text-red-500 text-center italic mb-2"
          >
            {{ processingPaymentError }}
            <!-- Display error message to your customers here -->
          </div>
          <div id="payment-element">
            <!--Stripe.js injects the Payment Element-->
          </div>

          <UButton
            v-if="showPaymentButton"
            size="xl"
            :loading="processingPayment"
            class="!bg-black mt-3 text-white justify-center text-sm w-full py-4 *:rounded-none cursor-pointer"
            @click="handlePayNow"
            >Pay Now</UButton
          >
        </div>
      </div>
      <div class="">
        <div class="py-4 px-8 bg-gray-100">
          <div v-for="item in cart.items" :key="item.sku" class="w-full">
            <div class="flex items-center gap-3 mb-3">
              <img
                :src="item.image"
                alt="product image"
                class="w-20 h-20 object-cover"
              />
              <div class="flex-1">
                <h3 class="font-semibold text-lg capitalize">
                  {{ item.name }}
                </h3>
                <div class="flex items-center justify-between text-sm">
                  <div class="">
                    <p class="text-gray-600">Color: {{ item.color }}</p>
                    <p class="text-gray-600">Quantity: {{ item.quantity }}</p>
                  </div>

                  <p class="text-gray-600">${{ item.priceAtTimeAdded }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 mb-10">
            <UInput
              color="neutral"
              placeholder="Enter discount code"
              :highlight="false"
              class="flex-5"
              v-model="discountCode"
              size="xl"
              :ui="{
                base: 'w-full px-4 py-4 ring-1 ring-gray-300 !rounded-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-gray-500',
              }"
            />

            <UButton
              color="primary"
              :disabled="!discountCode || isApplyingDiscount"
              @click="handleSubmitDiscount"
              class="flex-1 h-[55px] !rounded-none py-4 justify-center !bg-black text-white"
              >Discount</UButton
            >
          </div>

          <div class="">
            <div class="flex items-start justify-between mb-2">
              <p>Subtotal</p>
              <div class="flex flex-col items-end gap-1">
                <p class="font-semibold">${{ cart.totalPrice }}</p>
                <p v-if="cart?.appliedCoupon" class="text-sm font-extralight">
                  -${{ cart.appliedCoupon.discount.toFixed(2) }}
                </p>
              </div>
            </div>

            <div class="flex items-center justify-between mb-2">
              <p>Shipping</p>
              <p class="font-semibold">$0.00</p>
            </div>

            <div
              v-if="cart.totalPrice"
              class="flex items-center justify-between"
            >
              <p>Total</p>
              <p class="font-semibold">${{ calculatedTotalPrice }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
/* ------------------------------
   Page meta
--------------------------------*/
definePageMeta({
  middleware: 'checkout-tracker',
});

/* ------------------------------
   Imports
--------------------------------*/
import { countries } from 'countries-list';
import * as yup from 'yup';
import { loadStripe } from '@stripe/stripe-js';

const schema = yup.object({
  email: yup.string().email().required('Email is required'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  postalCode: yup.string().required('Postal code is required'),
  country: yup.string().required('Country is required'),
});

/* ------------------------------
    Setup
--------------------------------*/
const cartStore = useCartStore();
const { cart } = storeToRefs(cartStore);
const toast = useToast();
const config = useRuntimeConfig();

/* ------------------------------
    State & Refs
--------------------------------*/
const state = reactive({
  email: '',
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  postalCode: '',
  country: null,
});

const discountCode = ref('');
const isApplyingDiscount = ref(false);
const processingOrder = ref(false);
const processingOrderError = ref(null);
const processingPayment = ref(null);
const processingPaymentError = ref(null);
const showPaymentButton = ref(false);
const clientSecret = ref('');
let stripe = null;
let elements = null;

/* ------------------------------
    Computed
--------------------------------*/
const countryOptions = computed(() => {
  return Object.entries(countries).map(([code, country]) => ({
    label: country.name,
    value: code,
  }));
});

const calculatedTotalPrice = computed(() => {
  if (!cart.value) return 0;
  if (cart.value.appliedCoupon) {
    return (cart.value.totalPrice - cart.value.appliedCoupon.discount).toFixed(
      2
    );
  }
  return cart.value.totalPrice.toFixed(2);
});

/* ------------------------------
    Methods
--------------------------------*/
// discount code submission
async function handleSubmitDiscount() {
  try {
    isApplyingDiscount.value = true;
    const response = await $fetch('api/v1/coupon/apply-coupon', {
      method: 'POST',
      body: { code: discountCode.value },
      credentials: 'include',
      baseURL: config.public.apiBase,
    });

    if (response) {
      console.log('Discount applied:', response);
      await cartStore.getCart(); // Refresh cart to reflect discount

      toast.add({
        title: 'Success',
        description: 'Discount code applied successfully!',
      });
    }
    discountCode.value = '';
  } catch (error) {
    console.log('Error data:', error.data.message);
    toast.add({
      title: 'Error',
      description: 'Failed to apply discount code: ' + error.data.message,
    });
  } finally {
    isApplyingDiscount.value = false;
  }
}

// order submission
async function onSubmit() {
  if (stripe) return; // Prevent multiple initializations
  processingOrder.value = true;
  processingOrderError.value = null;
  try {
    const response = await $fetch('api/v1/order/create-order', {
      method: 'POST',
      body: {
        shippingAddress: {
          firstname: state.firstName,
          lastname: state.lastName,
          address: state.address,
          city: state.city,
          postalCode: state.postalCode,
          country: state.country,
        },
        customerEmail: state.email,
      },
      credentials: 'include',
      baseURL: config.public.apiBase,
    });

    if (response) {
      alert('Order created successfully! Please proceed to payment.');
      stripe = await loadStripe(config.public.stripePublicKey);
      clientSecret.value = response.data.clientSecret;
      elements = stripe.elements({
        clientSecret: clientSecret.value,
      });

      const paymentElement = elements.create('payment');
      paymentElement.mount('#payment-element');
      paymentElement.on('ready', () => {
        showPaymentButton.value = true;
      });
    }
  } catch (error) {
    console.log('Error creating order:', error.data.message);
    processingOrderError.value = error.data.message;
  } finally {
    processingOrder.value = false;
  }
}

// handle pay now
async function handlePayNow() {
  if (!stripe || !elements) {
    alert('Payment system is not ready. Please try again later.');
    return;
  }

  processingPayment.value = true;
  processingOrderError.value = null;
  try {
    // This validates payment data and collect data
    const { error: submitError } = await elements.submit();
    if (submitError) {
      alert(
        submitError.message || 'Payment submission failed. Please try again.'
      );
      processingPayment.value = false;
      return;
    }

    const result = await stripe.confirmPayment({
      elements,
      clientSecret: clientSecret.value,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });

    if (result.error) {
      if (result.error.type === 'card_error') {
        throw Error(result.error.message);
      } else {
        throw Error('Payment submission failed. Please try again.');
      }
    } else {
      alert('Payment Success');
    }
  } catch (error) {
    console.log('Error: ', error.message);
    processingPaymentError.value = error.message;
  } finally {
    processingPayment.value = false;
  }
}
</script>

<style lang="scss" scoped></style>
